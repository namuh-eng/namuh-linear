import { requireApiSession } from "@/lib/api-auth";
import { resolveActiveWorkspaceRef } from "@/lib/api-authz";
import { db } from "@/lib/db";
import { issue, team, workflowState } from "@/lib/db/schema";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const activeWorkspace = await resolveActiveWorkspaceRef(session.user.id);
  if (!activeWorkspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const workspaceId = activeWorkspace.workspaceId;

  // 1. Issues completed across all teams in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const completedStats = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      completedCount: count(issue.id),
    })
    .from(issue)
    .innerJoin(team, eq(issue.teamId, team.id))
    .innerJoin(workflowState, eq(issue.stateId, workflowState.id))
    .where(
      and(
        eq(team.workspaceId, workspaceId),
        eq(workflowState.category, "completed"),
        gte(issue.completedAt, thirtyDaysAgo),
      ),
    )
    .groupBy(team.id, team.name);

  // 2. Active issues (unstarted + started) per team
  const activeStats = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      activeCount: count(issue.id),
    })
    .from(issue)
    .innerJoin(team, eq(issue.teamId, team.id))
    .innerJoin(workflowState, eq(issue.stateId, workflowState.id))
    .where(
      and(
        eq(team.workspaceId, workspaceId),
        sql`${workflowState.category} IN ('unstarted', 'started')`,
      ),
    )
    .groupBy(team.id, team.name);

  return NextResponse.json({
    workspaceId,
    completedLast30Days: completedStats,
    activeIssues: activeStats,
    period: "Last 30 days",
  });
}
