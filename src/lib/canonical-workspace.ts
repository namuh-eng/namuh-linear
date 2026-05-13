import {
  CANONICAL_TEAM_KEY,
  CANONICAL_TEAM_NAME,
  CANONICAL_WORKSPACE_NAME,
  CANONICAL_WORKSPACE_SLUG,
} from "@/lib/canonical-routes";
import { db } from "@/lib/db";
import {
  member,
  team,
  teamMember,
  workflowState,
  workspace,
} from "@/lib/db/schema";
import { getDefaultWorkflowStates } from "@/lib/workspace-creation";
import { and, eq } from "drizzle-orm";

export async function ensureCanonicalWorkspaceForUser(userId: string) {
  let [workspaceRecord] = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      urlSlug: workspace.urlSlug,
    })
    .from(workspace)
    .where(eq(workspace.urlSlug, CANONICAL_WORKSPACE_SLUG))
    .limit(1);

  if (!workspaceRecord) {
    [workspaceRecord] = await db
      .insert(workspace)
      .values({
        name: CANONICAL_WORKSPACE_NAME,
        urlSlug: CANONICAL_WORKSPACE_SLUG,
        settings: {
          region: "United States",
          fiscalMonth: "january",
        },
      })
      .returning({
        id: workspace.id,
        name: workspace.name,
        urlSlug: workspace.urlSlug,
      });
  }

  const [existingMember] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.workspaceId, workspaceRecord.id),
        eq(member.userId, userId),
      ),
    )
    .limit(1);

  if (!existingMember) {
    await db.insert(member).values({
      userId,
      workspaceId: workspaceRecord.id,
      role: "owner",
    });
  }

  let [teamRecord] = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(
      and(
        eq(team.workspaceId, workspaceRecord.id),
        eq(team.key, CANONICAL_TEAM_KEY),
      ),
    )
    .limit(1);

  if (!teamRecord) {
    [teamRecord] = await db
      .insert(team)
      .values({
        name: CANONICAL_TEAM_NAME,
        key: CANONICAL_TEAM_KEY,
        workspaceId: workspaceRecord.id,
        cyclesEnabled: true,
        cycleStartDay: 1,
        cycleDurationWeeks: 2,
      })
      .returning({ id: team.id, name: team.name, key: team.key });
  }

  const [existingTeamMember] = await db
    .select({ id: teamMember.id })
    .from(teamMember)
    .where(
      and(eq(teamMember.teamId, teamRecord.id), eq(teamMember.userId, userId)),
    )
    .limit(1);

  if (!existingTeamMember) {
    await db.insert(teamMember).values({
      teamId: teamRecord.id,
      userId,
    });
  }

  const [existingWorkflowState] = await db
    .select({ id: workflowState.id })
    .from(workflowState)
    .where(eq(workflowState.teamId, teamRecord.id))
    .limit(1);

  if (!existingWorkflowState) {
    await db
      .insert(workflowState)
      .values(getDefaultWorkflowStates(teamRecord.id));
  }

  return { workspace: workspaceRecord, team: teamRecord };
}
