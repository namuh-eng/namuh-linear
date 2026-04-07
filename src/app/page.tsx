import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, team, workspace } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Check if user has any workspaces
  const memberships = await db
    .select({
      workspaceId: member.workspaceId,
      workspaceSlug: workspace.urlSlug,
    })
    .from(member)
    .innerJoin(workspace, eq(member.workspaceId, workspace.id))
    .where(eq(member.userId, session.user.id))
    .limit(1);

  if (memberships.length === 0) {
    redirect("/create-workspace");
  }

  // Get the first team in the workspace to redirect to
  const teams = await db
    .select({ key: team.key })
    .from(team)
    .where(eq(team.workspaceId, memberships[0].workspaceId))
    .limit(1);

  if (teams.length > 0) {
    redirect(`/team/${teams[0].key}/all`);
  }

  redirect("/team");
}
