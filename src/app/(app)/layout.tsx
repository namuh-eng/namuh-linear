import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, team, workspace } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  // Get user's workspace
  const memberships = await db
    .select({
      workspaceId: member.workspaceId,
      workspaceName: workspace.name,
      workspaceSlug: workspace.urlSlug,
    })
    .from(member)
    .innerJoin(workspace, eq(member.workspaceId, workspace.id))
    .where(eq(member.userId, session.user.id))
    .orderBy(desc(member.createdAt))
    .limit(1);

  if (memberships.length === 0) {
    redirect("/create-workspace");
  }

  const ws = memberships[0];

  // Get first team
  const teams = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(eq(team.workspaceId, ws.workspaceId))
    .orderBy(desc(team.createdAt))
    .limit(50);

  const firstTeam = teams[0] ?? { id: "", name: "Team", key: "TEAM" };

  return (
    <AppShell
      workspaceName={ws.workspaceName}
      workspaceInitials={ws.workspaceName.substring(0, 2).toUpperCase()}
      teamName={firstTeam.name}
      teamId={firstTeam.id}
      teamKey={firstTeam.key}
      teams={teams}
    >
      {children}
    </AppShell>
  );
}
