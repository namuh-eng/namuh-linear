import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  issue,
  issueLabel,
  label,
  project,
  team,
  user,
  workflowState,
} from "@/lib/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
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

  // Find team by key
  const teams = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(eq(team.key, key))
    .limit(1);

  if (teams.length === 0) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const teamRecord = teams[0];

  // Get workflow states for this team
  const states = await db
    .select()
    .from(workflowState)
    .where(eq(workflowState.teamId, teamRecord.id))
    .orderBy(asc(workflowState.position));

  // Get issues with assignee info
  const issues = await db
    .select({
      id: issue.id,
      number: issue.number,
      identifier: issue.identifier,
      title: issue.title,
      priority: issue.priority,
      stateId: issue.stateId,
      assigneeId: issue.assigneeId,
      assigneeName: user.name,
      assigneeImage: user.image,
      projectId: issue.projectId,
      projectName: project.name,
      dueDate: issue.dueDate,
      createdAt: issue.createdAt,
      sortOrder: issue.sortOrder,
    })
    .from(issue)
    .leftJoin(user, eq(issue.assigneeId, user.id))
    .leftJoin(project, eq(issue.projectId, project.id))
    .where(eq(issue.teamId, teamRecord.id))
    .orderBy(asc(issue.sortOrder), desc(issue.createdAt));

  // Get labels for all issues
  const issueIds = issues.map((i) => i.id);
  let labelsMap: Record<string, { name: string; color: string }[]> = {};

  if (issueIds.length > 0) {
    const issueLabelRows = await db
      .select({
        issueId: issueLabel.issueId,
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
        name: row.labelName,
        color: row.labelColor,
      });
    }
  }

  // Group issues by workflow state
  const grouped = states.map((state) => ({
    state: {
      id: state.id,
      name: state.name,
      category: state.category,
      color: state.color,
      position: state.position,
    },
    issues: issues
      .filter((i) => i.stateId === state.id)
      .map((i) => ({
        id: i.id,
        number: i.number,
        identifier: i.identifier,
        title: i.title,
        priority: i.priority,
        stateId: i.stateId,
        assigneeId: i.assigneeId,
        assignee: i.assigneeName
          ? {
              name: i.assigneeName,
              image: i.assigneeImage,
            }
          : null,
        labels: labelsMap[i.id] ?? [],
        labelIds: (labelsMap[i.id] ?? []).map((l) => l.name),
        projectId: i.projectId,
        projectName: i.projectName,
        dueDate: i.dueDate,
        createdAt: i.createdAt,
      })),
  }));

  // Build unique assignees and labels for filter options
  const uniqueAssignees: { id: string; name: string; image: string | null }[] =
    [];
  const seenAssignees = new Set<string>();
  for (const i of issues) {
    if (i.assigneeId && i.assigneeName && !seenAssignees.has(i.assigneeId)) {
      seenAssignees.add(i.assigneeId);
      uniqueAssignees.push({
        id: i.assigneeId,
        name: i.assigneeName,
        image: i.assigneeImage,
      });
    }
  }

  const uniqueLabels: { id: string; name: string; color: string }[] = [];
  const seenLabels = new Set<string>();
  for (const labelList of Object.values(labelsMap)) {
    for (const l of labelList) {
      if (!seenLabels.has(l.name)) {
        seenLabels.add(l.name);
        uniqueLabels.push({ id: l.name, name: l.name, color: l.color });
      }
    }
  }

  return NextResponse.json({
    team: { id: teamRecord.id, name: teamRecord.name, key: teamRecord.key },
    groups: grouped,
    filterOptions: {
      statuses: states.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        color: s.color,
      })),
      assignees: uniqueAssignees,
      labels: uniqueLabels,
      priorities: [
        { value: "urgent", label: "Urgent" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
        { value: "none", label: "No priority" },
      ],
    },
  });
}
