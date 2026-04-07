"use client";

import { Sidebar } from "@/components/sidebar";

interface AppShellProps {
  children: React.ReactNode;
  workspaceName: string;
  workspaceInitials: string;
  teamName: string;
  teamKey: string;
}

export function AppShell({
  children,
  workspaceName,
  workspaceInitials,
  teamName,
  teamKey,
}: AppShellProps) {
  return (
    <div className="flex h-screen bg-[#090909]">
      <Sidebar
        workspaceName={workspaceName}
        workspaceInitials={workspaceInitials}
        teamName={teamName}
        teamKey={teamKey}
      />
      <main className="flex-1 overflow-hidden p-2 pl-0">
        <div className="h-full overflow-y-auto rounded-xl bg-[#0f0f11] border border-[#1c1e21]">
          {children}
        </div>
      </main>
    </div>
  );
}
