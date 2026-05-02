import { requireApiSession } from "@/lib/api-auth";
import { validateIssueCreateRefs } from "@/lib/api-authz";
import { db } from "@/lib/db";
import { issue, issueLabel } from "@/lib/db/schema";
import { normalizeIssueDescriptionHtml } from "@/lib/issue-description";
import {
  buildNotificationValues,
  insertNotifications,
} from "@/lib/notifications";
import { findAccessibleTeamById } from "@/lib/teams";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
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

  const teamRecord = await findAccessibleTeamById(teamId, session.user.id);
  if (!teamRecord) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const refs = await validateIssueCreateRefs(
    { stateId, labelIds, parentIssueId, projectId, assigneeId },
    teamRecord,
  );
  if (!refs.ok) {
    return NextResponse.json({ error: refs.error }, { status: 400 });
  }

  const maxResult = await db
    .select({ maxNum: sql<number>`COALESCE(MAX(${issue.number}), 0)` })
    .from(issue)
    .where(eq(issue.teamId, teamRecord.id));

  const nextNumber = (maxResult[0]?.maxNum ?? 0) + 1;
  const identifier = `${teamRecord.key}-${nextNumber}`;
  const normalizedDescription = normalizeIssueDescriptionHtml(description);

  const newIssue = await db.transaction(async (tx) => {
    const [createdIssue] = await tx
      .insert(issue)
      .values({
        number: nextNumber,
        identifier,
        title: trimmedTitle,
        description: normalizedDescription,
        teamId: teamRecord.id,
        stateId: refs.stateId,
        creatorId: session.user.id,
        priority: priority || "none",
        assigneeId: refs.assigneeId,
        projectId: refs.projectId,
        parentIssueId: refs.parentIssueId,
      })
      .returning();

    if (refs.labelIds.length > 0) {
      await tx.insert(issueLabel).values(
        refs.labelIds.map((labelId) => ({
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
