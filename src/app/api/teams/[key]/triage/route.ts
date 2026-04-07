import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  issue,
  issueLabel,
  label,
  team,
  user,
  workflowState,
} from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;

  const teams = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(eq(team.key, key))
    .limit(1);

  if (teams.length === 0) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const teamRecord = teams[0];

  // Find triage workflow states
  const triageStates = await db
    .select({
      id: workflowState.id,
      name: workflowState.name,
      color: workflowState.color,
    })
    .from(workflowState)
    .where(
      and(
        eq(workflowState.teamId, teamRecord.id),
        eq(workflowState.category, "triage"),
      ),
    );

  if (triageStates.length === 0) {
    return NextResponse.json({
      team: teamRecord,
      issues: [],
      count: 0,
      createStateId: null,
      createStateName: null,
    });
  }

  const triageStateIds = triageStates.map((s) => s.id);

  // Get issues in triage state with creator info
  const issues = await db
    .select({
      id: issue.id,
      number: issue.number,
      identifier: issue.identifier,
      title: issue.title,
      priority: issue.priority,
      stateId: issue.stateId,
      stateName: workflowState.name,
      stateColor: workflowState.color,
      creatorId: issue.creatorId,
      creatorName: user.name,
      creatorImage: user.image,
      createdAt: issue.createdAt,
    })
    .from(issue)
    .innerJoin(workflowState, eq(issue.stateId, workflowState.id))
    .leftJoin(user, eq(issue.creatorId, user.id))
    .where(
      and(
        eq(issue.teamId, teamRecord.id),
        inArray(issue.stateId, triageStateIds),
      ),
    )
    .orderBy(desc(issue.createdAt));

  // Get labels for issues
  const issueIds = issues.map((i) => i.id);
  let labelsMap: Record<string, { id: string; name: string; color: string }[]> =
    {};

  if (issueIds.length > 0) {
    const issueLabelRows = await db
      .select({
        issueId: issueLabel.issueId,
        labelId: label.id,
        labelName: label.name,
        labelColor: label.color,
      })
      .from(issueLabel)
      .innerJoin(label, eq(issueLabel.labelId, label.id))
      .where(inArray(issueLabel.issueId, issueIds));

    labelsMap = {};
    for (const row of issueLabelRows) {
      if (!labelsMap[row.issueId]) {
        labelsMap[row.issueId] = [];
      }
      labelsMap[row.issueId].push({
        id: row.labelId,
        name: row.labelName,
        color: row.labelColor,
      });
    }
  }

  const formattedIssues = issues.map((i) => ({
    id: i.id,
    identifier: i.identifier,
    title: i.title,
    priority: i.priority,
    stateId: i.stateId,
    stateName: i.stateName,
    stateColor: i.stateColor,
    creatorId: i.creatorId,
    creatorName: i.creatorName ?? "Unknown",
    creatorImage: i.creatorImage,
    createdAt: i.createdAt,
    labelIds: (labelsMap[i.id] ?? []).map((currentLabel) => currentLabel.id),
    labels: labelsMap[i.id] ?? [],
    assigneeId: null,
    projectId: null,
  }));

  return NextResponse.json({
    team: teamRecord,
    issues: formattedIssues,
    count: formattedIssues.length,
    createStateId: triageStateIds[0] ?? null,
    createStateName: triageStates[0]?.name ?? null,
  });
}
