import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { issue, issueLabel, team, workflowState } from "@/lib/db/schema";
import { normalizeIssueDescriptionHtml } from "@/lib/issue-description";
import {
  buildNotificationValues,
  insertNotifications,
} from "@/lib/notifications";
import { and, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    teamId,
    stateId,
    priority,
    assigneeId,
    projectId,
    labelIds,
    parentIssueId,
  } = body;

  const trimmedTitle = typeof title === "string" ? title.trim() : "";

  if (!trimmedTitle || !teamId) {
    return NextResponse.json(
      { error: "Title and teamId are required" },
      { status: 400 },
    );
  }

  // Get team to generate identifier
  const teams = await db
    .select({ id: team.id, key: team.key })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  if (teams.length === 0) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const teamRecord = teams[0];

  // Get next issue number for this team
  const maxResult = await db
    .select({ maxNum: sql<number>`COALESCE(MAX(${issue.number}), 0)` })
    .from(issue)
    .where(eq(issue.teamId, teamId));

  const nextNumber = (maxResult[0]?.maxNum ?? 0) + 1;
  const identifier = `${teamRecord.key}-${nextNumber}`;

  // Use provided stateId or find default backlog state
  let finalStateId = stateId;
  if (!finalStateId) {
    const defaultState = await db
      .select({ id: workflowState.id })
      .from(workflowState)
      .where(
        and(
          eq(workflowState.teamId, teamId),
          eq(workflowState.category, "backlog"),
        ),
      )
      .limit(1);

    finalStateId = defaultState[0]?.id;
  }

  if (!finalStateId) {
    return NextResponse.json(
      { error: "No default workflow state found" },
      { status: 400 },
    );
  }

  const normalizedDescription = normalizeIssueDescriptionHtml(description);
  const uniqueLabelIds = Array.isArray(labelIds)
    ? [...new Set(labelIds.filter((value): value is string => Boolean(value)))]
    : [];

  const newIssue = await db.transaction(async (tx) => {
    const [createdIssue] = await tx
      .insert(issue)
      .values({
        number: nextNumber,
        identifier,
        title: trimmedTitle,
        description: normalizedDescription,
        teamId,
        stateId: finalStateId,
        creatorId: session.user.id,
        priority: priority || "none",
        assigneeId: assigneeId || null,
        projectId: projectId || null,
        parentIssueId: parentIssueId || null,
      })
      .returning();

    if (uniqueLabelIds.length > 0) {
      await tx.insert(issueLabel).values(
        uniqueLabelIds.map((labelId) => ({
          issueId: createdIssue.id,
          labelId,
        })),
      );
    }

    return createdIssue;
  });

  if (newIssue.assigneeId) {
    await insertNotifications(
      buildNotificationValues({
        type: "assigned",
        actorId: session.user.id,
        issueId: newIssue.id,
        userIds: [newIssue.assigneeId],
      }),
    );
  }

  return NextResponse.json(newIssue, { status: 201 });
}
