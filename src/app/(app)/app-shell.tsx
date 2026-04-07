"use client";

import { CommandPalette } from "@/components/command-palette";
import { CreateIssueModal } from "@/components/create-issue-modal";
import { Sidebar, type SidebarTeam } from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
  workspaceName: string;
  workspaceInitials: string;
  teamName: string;
  teamId: string;
  teamKey: string;
  teams?: SidebarTeam[];
}

interface ShellContext {
  workspaceName: string;
  workspaceInitials: string;
  teamName: string;
  teamId: string;
  teamKey: string;
  teams: SidebarTeam[];
}

function getActiveTeamKey(pathname: string): string | null {
  const teamMatch = pathname.match(/^\/team\/([^/]+)/);
  if (teamMatch) {
    return decodeURIComponent(teamMatch[1]);
  }

  const settingsMatch = pathname.match(/^\/settings\/teams\/([^/]+)/);
  if (settingsMatch) {
    return decodeURIComponent(settingsMatch[1]);
  }

  return null;
}

export function AppShell({
  children,
  workspaceName,
  workspaceInitials,
  teamName,
  teamId,
  teamKey,
  teams,
}: AppShellProps) {
  const pathname = usePathname();
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [shellContext, setShellContext] = useState<ShellContext>({
    workspaceName,
    workspaceInitials,
    teamName,
    teamId,
    teamKey,
    teams:
      teams && teams.length > 0
        ? teams
        : [{ id: teamId, name: teamName, key: teamKey }],
  });

  useEffect(() => {
    const fallbackContext = {
      workspaceName,
      workspaceInitials,
      teamName,
      teamId,
      teamKey,
      teams:
        teams && teams.length > 0
          ? teams
          : [{ id: teamId, name: teamName, key: teamKey }],
    };
    const activeTeamKey = getActiveTeamKey(pathname);

    if (!activeTeamKey || activeTeamKey === fallbackContext.teamKey) {
      setShellContext(fallbackContext);
      return;
    }

    let cancelled = false;

    fetch(`/api/teams/${encodeURIComponent(activeTeamKey)}/context`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load team context");
        }

        return (await response.json()) as ShellContext;
      })
      .then((context) => {
        if (!cancelled) {
          setShellContext(context);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setShellContext(fallbackContext);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    pathname,
    teamId,
    teamKey,
    teamName,
    teams,
    workspaceInitials,
    workspaceName,
  ]);

  return (
    <div className="flex h-screen bg-[var(--color-sidebar-bg)]">
      <Sidebar
        workspaceName={shellContext.workspaceName}
        workspaceInitials={shellContext.workspaceInitials}
        teamName={shellContext.teamName}
        teamKey={shellContext.teamKey}
        teams={shellContext.teams}
        onCreateIssue={() => setShowCreateIssue(true)}
      />
      <main className="flex-1 overflow-hidden p-2 pl-0">
        <div className="h-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-content-bg)] transition-colors">
          {children}
        </div>
      </main>
      <CreateIssueModal
        open={showCreateIssue}
        onClose={() => setShowCreateIssue(false)}
        teamId={shellContext.teamId}
        teamKey={shellContext.teamKey}
        teamName={shellContext.teamName}
      />
      <CommandPalette teamKey={shellContext.teamKey} />
    </div>
  );
}
