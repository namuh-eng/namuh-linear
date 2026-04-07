"use client";

import { CommandPalette } from "@/components/command-palette";
import { CreateIssueModal } from "@/components/create-issue-modal";
import { Sidebar, type SidebarTeam } from "@/components/sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
  workspaceId?: string;
  workspaceName: string;
  workspaceInitials: string;
  teamName: string;
  teamId: string;
  teamKey: string;
  teams?: SidebarTeam[];
}

interface ShellContext {
  workspaceId: string;
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

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

export function AppShell({
  children,
  workspaceId = "",
  workspaceName,
  workspaceInitials,
  teamName,
  teamId,
  teamKey,
  teams,
}: AppShellProps) {
  const pathname = usePathname();
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [shellContext, setShellContext] = useState<ShellContext>({
    workspaceId,
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
      workspaceId,
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
    workspaceId,
    workspaceInitials,
    workspaceName,
  ]);

  useEffect(() => {
    document.cookie = `activeWorkspaceId=${shellContext.workspaceId}; path=/; samesite=lax`;
  }, [shellContext.workspaceId]);

  useEffect(() => {
    let cancelled = false;

    async function syncInboxUnreadCount() {
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { unreadCount?: number };
        if (!cancelled) {
          setInboxUnreadCount(data.unreadCount ?? 0);
        }
      } catch {
        if (!cancelled) {
          setInboxUnreadCount(0);
        }
      }
    }

    function handleNotificationsChanged(event: Event) {
      const customEvent = event as CustomEvent<{ unreadCount?: number }>;
      if (typeof customEvent.detail?.unreadCount === "number") {
        setInboxUnreadCount(customEvent.detail.unreadCount);
        return;
      }

      void syncInboxUnreadCount();
    }

    void syncInboxUnreadCount();
    const intervalId = window.setInterval(() => {
      void syncInboxUnreadCount();
    }, 15000);
    const handleFocus = () => {
      void syncInboxUnreadCount();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener(
      "notifications:changed",
      handleNotificationsChanged as EventListener,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(
        "notifications:changed",
        handleNotificationsChanged as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    function handleOpenCreateIssue() {
      setShowCreateIssue(true);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.key.toLowerCase() !== "c" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      setShowCreateIssue(true);
    }

    window.addEventListener("open-create-issue", handleOpenCreateIssue);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("open-create-issue", handleOpenCreateIssue);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="flex h-screen bg-[var(--color-sidebar-bg)]">
      <Sidebar
        workspaceName={shellContext.workspaceName}
        workspaceInitials={shellContext.workspaceInitials}
        teamName={shellContext.teamName}
        teamKey={shellContext.teamKey}
        teams={shellContext.teams}
        inboxUnreadCount={inboxUnreadCount}
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
