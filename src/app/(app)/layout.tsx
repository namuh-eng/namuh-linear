import { autoJoinWorkspaceForApprovedDomain } from "@/lib/approved-domain-auto-join";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, team, workspace } from "@/lib/db/schema";
import { isAppRoutePrefix, normalizeAppPath } from "@/lib/workspace-paths";
import { desc, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }
  const cookieStore = await cookies();
  const preferredWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;
  const requestedWorkspaceSlug = requestHeaders.get("x-workspace-slug");
  const sourcePath = requestHeaders.get("x-workspace-source-path");

  const loadMemberships = () =>
    db
      .select({
        workspaceId: member.workspaceId,
        workspaceName: workspace.name,
        workspaceSlug: workspace.urlSlug,
      })
      .from(member)
      .innerJoin(workspace, eq(member.workspaceId, workspace.id))
      .where(eq(member.userId, session.user.id))
      .orderBy(desc(member.createdAt))
      .limit(50);

  let memberships = await loadMemberships();

  if (memberships.length === 0) {
    await autoJoinWorkspaceForApprovedDomain({
      userId: session.user.id,
      email: session.user.email,
    });
    memberships = await loadMemberships();

    if (memberships.length === 0) {
      redirect("/create-workspace");
    }
  }

  const ws = requestedWorkspaceSlug
    ? memberships.find(
        (membership) => membership.workspaceSlug === requestedWorkspaceSlug,
      )
    : (memberships.find(
        (membership) => membership.workspaceId === preferredWorkspaceId,
      ) ?? memberships[0]);

  if (!ws) {
    notFound();
  }

  if (!requestedWorkspaceSlug && sourcePath) {
    const normalizedSourcePath = normalizeAppPath(sourcePath);
    const firstSegment = normalizedSourcePath.split("/").filter(Boolean)[0];

    if (isAppRoutePrefix(firstSegment)) {
      redirect(`/${ws.workspaceSlug}${normalizedSourcePath}`);
    }
  }

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
      workspaceId={ws.workspaceId}
      workspaceSlug={ws.workspaceSlug}
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
