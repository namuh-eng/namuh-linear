import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { db } from "@/lib/db";
import { member, team } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function getTeamByKey(
  key: string,
): Promise<{ id: string; name: string; key: string } | null> {
  const teams = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(eq(team.key, key))
    .limit(1);
  return teams[0] ?? null;
}

export async function getTeamIdByKey(key: string): Promise<string | null> {
  const t = await getTeamByKey(key);
  return t?.id ?? null;
}

export async function getWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<{ id: string } | null> {
  const [row] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.workspaceId, workspaceId), eq(member.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function findAccessibleTeam(key: string, userId: string) {
  const workspaceId = await resolveActiveWorkspaceId(userId);
  if (!workspaceId) return null;

  const wsMember = await getWorkspaceMember(workspaceId, userId);
  if (!wsMember) return null;

  const [teamRecord] = await db
    .select({
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      key: team.key,
      icon: team.icon,
      timezone: team.timezone,
      estimateType: team.estimateType,
      triageEnabled: team.triageEnabled,
      cyclesEnabled: team.cyclesEnabled,
      cycleStartDay: team.cycleStartDay,
      cycleDurationWeeks: team.cycleDurationWeeks,
      settings: team.settings,
    })
    .from(team)
    .where(and(eq(team.key, key), eq(team.workspaceId, workspaceId)))
    .limit(1);

  return teamRecord ?? null;
}
