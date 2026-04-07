import { auth } from "@/lib/auth";
import { cycleRangesOverlap, parseCycleDateInput } from "@/lib/cycle-utils";
import { db } from "@/lib/db";
import {
  cycle,
  issue,
  issueLabel,
  label,
  team,
  user,
  workflowState,
} from "@/lib/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string; cycleId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, cycleId } = await params;

  const teams = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(eq(team.key, key))
    .limit(1);

  if (teams.length === 0) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const teamRecord = teams[0];

  const cycles = await db
    .select()
    .from(cycle)
    .where(and(eq(cycle.id, cycleId), eq(cycle.teamId, teamRecord.id)))
    .limit(1);

  if (cycles.length === 0) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  const cycleRecord = cycles[0];

  // Get workflow states for this team
  const states = await db
    .select()
    .from(workflowState)
    .where(eq(workflowState.teamId, teamRecord.id))
    .orderBy(asc(workflowState.position));

  // Get issues in this cycle
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
      dueDate: issue.dueDate,
      createdAt: issue.createdAt,
      sortOrder: issue.sortOrder,
    })
    .from(issue)
    .leftJoin(user, eq(issue.assigneeId, user.id))
    .where(eq(issue.cycleId, cycleId))
    .orderBy(asc(issue.sortOrder), desc(issue.createdAt));

  // Get labels for issues
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
  const completedStates = states.filter((s) => s.category === "completed");
  const completedStateIds = new Set(completedStates.map((s) => s.id));

  const groups = states.map((state) => ({
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
          ? { name: i.assigneeName, image: i.assigneeImage }
          : null,
        labels: labelsMap[i.id] ?? [],
        labelIds: (labelsMap[i.id] ?? []).map((l) => l.name),
        projectId: i.projectId,
        dueDate: i.dueDate,
        createdAt: i.createdAt,
      })),
  }));

  return NextResponse.json({
    team: teamRecord,
    cycle: {
      ...cycleRecord,
      issueCount: issues.length,
      completedIssueCount: issues.filter((i) =>
        completedStateIds.has(i.stateId),
      ).length,
    },
    groups,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string; cycleId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, cycleId } = await params;
  const body = await request.json();

  const teams = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.key, key))
    .limit(1);

  if (teams.length === 0) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const existingCycles = await db
    .select({
      id: cycle.id,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    })
    .from(cycle)
    .where(and(eq(cycle.id, cycleId), eq(cycle.teamId, teams[0].id)))
    .limit(1);

  if (existingCycles.length === 0) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  const existingCycle = existingCycles[0];
  const nextStartDate =
    body.startDate !== undefined
      ? parseCycleDateInput(body.startDate)
      : existingCycle.startDate;
  const nextEndDate =
    body.endDate !== undefined
      ? parseCycleDateInput(body.endDate)
      : existingCycle.endDate;

  if (!nextStartDate || !nextEndDate) {
    return NextResponse.json(
      { error: "Start and end dates must use YYYY-MM-DD format" },
      { status: 400 },
    );
  }

  if (nextStartDate.getTime() > nextEndDate.getTime()) {
    return NextResponse.json(
      { error: "Cycle end date must be on or after the start date" },
      { status: 400 },
    );
  }

  const allTeamCycles = await db
    .select({
      id: cycle.id,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    })
    .from(cycle)
    .where(eq(cycle.teamId, teams[0].id));

  const overlappingCycle = allTeamCycles.find(
    (teamCycle) =>
      teamCycle.id !== cycleId &&
      cycleRangesOverlap(
        nextStartDate,
        nextEndDate,
        teamCycle.startDate,
        teamCycle.endDate,
      ),
  );

  if (overlappingCycle) {
    return NextResponse.json(
      { error: "Cycle dates overlap with an existing cycle" },
      { status: 409 },
    );
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
    startDate: nextStartDate,
    endDate: nextEndDate,
  };
  if (body.name !== undefined) updateData.name = body.name;
  if (body.autoRollover !== undefined)
    updateData.autoRollover = body.autoRollover;

  const updated = await db
    .update(cycle)
    .set(updateData)
    .where(and(eq(cycle.id, cycleId), eq(cycle.teamId, teams[0].id)))
    .returning();

  if (updated.length === 0) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  return NextResponse.json(updated[0]);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string; cycleId: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key, cycleId } = await params;

  const teams = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.key, key))
    .limit(1);

  if (teams.length === 0) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Unlink issues from cycle before deleting
  await db
    .update(issue)
    .set({ cycleId: null })
    .where(eq(issue.cycleId, cycleId));

  const deleted = await db
    .delete(cycle)
    .where(and(eq(cycle.id, cycleId), eq(cycle.teamId, teams[0].id)))
    .returning();

  if (deleted.length === 0) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
