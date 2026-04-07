import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  comment,
  issue,
  issueLabel,
  label,
  member,
  team,
  user,
  workflowState,
} from "@/lib/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "assigned";

  // Get user's workspace
  const memberships = await db
    .select({ workspaceId: member.workspaceId })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1);

  if (memberships.length === 0) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const workspaceId = memberships[0].workspaceId;

  // Get all teams in workspace
  const teams = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(eq(team.workspaceId, workspaceId));

  const teamIds = teams.map((t) => t.id);
  if (teamIds.length === 0) {
    return NextResponse.json({ groups: [], filterOptions: emptyFilterOptions });
  }

  // Get all workflow states for workspace teams
  const states = await db
    .select()
    .from(workflowState)
    .where(inArray(workflowState.teamId, teamIds))
    .orderBy(asc(workflowState.position));

  // Determine which issues to fetch based on tab
  let issues: IssueRecord[];

  if (tab === "assigned") {
    issues = await fetchIssuesByAssignee(userId, teamIds);
  } else if (tab === "created") {
    issues = await fetchIssuesByCreator(userId, teamIds);
  } else if (tab === "subscribed") {
    // Subscribed = issues user has commented on (but isn't assignee)
    const commentedIssueIds = await db
      .select({ issueId: comment.issueId })
      .from(comment)
      .where(eq(comment.userId, userId));

    const uniqueIssueIds = [
      ...new Set(commentedIssueIds.map((c) => c.issueId)),
    ];

    if (uniqueIssueIds.length === 0) {
      return NextResponse.json({
        groups: [],
        filterOptions: emptyFilterOptions,
      });
    }

    issues = await db
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
        dueDate: issue.dueDate,
        createdAt: issue.createdAt,
        sortOrder: issue.sortOrder,
        teamId: issue.teamId,
      })
      .from(issue)
      .leftJoin(user, eq(issue.assigneeId, user.id))
      .where(
        and(inArray(issue.teamId, teamIds), inArray(issue.id, uniqueIssueIds)),
      )
      .orderBy(asc(issue.sortOrder), desc(issue.createdAt));
  } else {
    // "activity" — most recently updated issues the user interacted with (assigned + created + commented)
    issues = await fetchIssuesByAssignee(userId, teamIds);
    const createdIssues = await fetchIssuesByCreator(userId, teamIds);

    const seenIds = new Set(issues.map((i) => i.id));
    for (const ci of createdIssues) {
      if (!seenIds.has(ci.id)) {
        issues.push(ci);
        seenIds.add(ci.id);
      }
    }
  }

  // Get labels for all issues
  const issueIds = issues.map((i) => i.id);
  const labelsMap: Record<string, { name: string; color: string }[]> = {};

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

  // Build team lookup
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  // Group issues by workflow state category (Triage, Active, Backlog)
  const stateMap = new Map(states.map((s) => [s.id, s]));

  const grouped = states
    .map((state) => ({
      state: {
        id: state.id,
        name: state.name,
        category: state.category,
        color: state.color,
        position: state.position,
      },
      issues: issues
        .filter((i) => i.stateId === state.id)
        .map((i) => {
          const t = teamMap.get(i.teamId);
          return {
            id: i.id,
            number: i.number,
            identifier: i.identifier,
            title: i.title,
            priority: i.priority,
            stateId: i.stateId,
            assigneeId: i.assigneeId,
            assignee: i.assigneeName
              ? { name: i.assigneeName, image: i.assigneeImage }
              : null,
            labels: labelsMap[i.id] ?? [],
            labelIds: (labelsMap[i.id] ?? []).map((l) => l.name),
            projectId: i.projectId,
            dueDate: i.dueDate,
            createdAt: i.createdAt,
            teamKey: t?.key ?? "",
          };
        }),
    }))
    .filter((g) => g.issues.length > 0);

  // Build filter options
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
    groups: grouped,
    totalCount: issues.length,
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

// ─── Helpers ────────────────────────────────────────────────────────

interface IssueRecord {
  id: string;
  number: number;
  identifier: string;
  title: string;
  priority: string;
  stateId: string;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeImage: string | null;
  projectId: string | null;
  dueDate: Date | null;
  createdAt: Date;
  sortOrder: number;
  teamId: string;
}

const emptyFilterOptions = {
  statuses: [],
  assignees: [],
  labels: [],
  priorities: [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "none", label: "No priority" },
  ],
};

async function fetchIssuesByAssignee(
  userId: string,
  teamIds: string[],
): Promise<IssueRecord[]> {
  return db
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
      dueDate: issue.dueDate,
      createdAt: issue.createdAt,
      sortOrder: issue.sortOrder,
      teamId: issue.teamId,
    })
    .from(issue)
    .leftJoin(user, eq(issue.assigneeId, user.id))
    .where(and(inArray(issue.teamId, teamIds), eq(issue.assigneeId, userId)))
    .orderBy(asc(issue.sortOrder), desc(issue.createdAt));
}

async function fetchIssuesByCreator(
  userId: string,
  teamIds: string[],
): Promise<IssueRecord[]> {
  return db
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
      dueDate: issue.dueDate,
      createdAt: issue.createdAt,
      sortOrder: issue.sortOrder,
      teamId: issue.teamId,
    })
    .from(issue)
    .leftJoin(user, eq(issue.assigneeId, user.id))
    .where(and(inArray(issue.teamId, teamIds), eq(issue.creatorId, userId)))
    .orderBy(asc(issue.sortOrder), desc(issue.createdAt));
}
