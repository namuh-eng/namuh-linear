import { requireApiSession } from "@/lib/api-auth";
import { resolveActiveWorkspaceRef } from "@/lib/api-authz";
import { db } from "@/lib/db";
import { issue, team } from "@/lib/db/schema";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query || query.length === 0) {
    return NextResponse.json([]);
  }

  const activeWorkspace = await resolveActiveWorkspaceRef(session.user.id);
  if (!activeWorkspace) {
    return NextResponse.json([]);
  }

  const { workspaceId } = activeWorkspace;

  // Get active workspace teams
  const workspaceTeams = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.workspaceId, workspaceId));

  const teamIds = workspaceTeams.map((t) => t.id);

  if (teamIds.length === 0) {
    return NextResponse.json([]);
  }

  // Search issues by title or identifier
  const results = await db
    .select({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      priority: issue.priority,
    })
    .from(issue)
    .where(
      and(
        inArray(issue.teamId, teamIds),
        or(
          ilike(issue.title, `%${query}%`),
          ilike(issue.identifier, `%${query}%`),
        ),
      ),
    )
    .orderBy(issue.createdAt)
    .limit(10);

  return NextResponse.json(results);
}
