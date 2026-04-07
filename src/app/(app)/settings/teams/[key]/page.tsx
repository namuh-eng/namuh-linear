"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TeamData {
  name: string;
  key: string;
  icon: string;
  memberCount: number;
  labelCount: number;
  statusCount: number;
  triageEnabled: boolean;
  cyclesEnabled: boolean;
}

function SettingsCard({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex cursor-pointer items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-text-tertiary)]">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div>
          <div className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {title}
          </div>
          <div className="text-[12px] text-[var(--color-text-tertiary)]">
            {description}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[12px] text-[var(--color-text-secondary)]">
            {badge}
          </span>
        )}
        <svg
          className="h-4 w-4 text-[var(--color-text-tertiary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-8 text-[14px] font-semibold text-[var(--color-text-primary)]">
      {children}
    </h2>
  );
}

function DangerButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:border-red-500/50 hover:text-red-400"
    >
      {children}
    </button>
  );
}

export default function TeamSettingsHubPage() {
  const params = useParams();
  const key = params.key as string;
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teams/${key}/settings`)
      .then((res) => res.json())
      .then((data) => setTeam(data.team))
      .finally(() => setLoading(false));
  }, [key]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Team not found
      </div>
    );
  }

  return (
    <div className="max-w-[720px]">
      {/* Team header */}
      <div className="mb-8 flex items-center gap-3">
        <span className="text-[28px]">{team.icon}</span>
        <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
          {team.name}
        </h1>
      </div>

      {/* General settings cards */}
      <div className="flex flex-col gap-2">
        <SettingsCard
          title="General"
          description="Name, identifier, timezone, estimates, and broader settings"
        />
        <SettingsCard
          title="Members"
          description="Manage team members"
          badge={`${team.memberCount} members`}
        />
        <SettingsCard
          title="Slack notifications"
          description="Broadcast notifications to Slack"
        />
      </div>

      {/* Issues, projects, and docs */}
      <SectionTitle>Issues, projects, and docs</SectionTitle>
      <div className="flex flex-col gap-2">
        <SettingsCard
          title="Issue labels"
          description="Labels available to this team's issues"
          badge={`${team.labelCount} labels`}
        />
        <SettingsCard
          title="Templates"
          description="Pre-filled templates for issues, documents, and projects"
          badge="None"
        />
        <SettingsCard
          title="Recurring issues"
          description="Automatically create issues on a schedule"
          badge="None"
        />
      </div>

      {/* Workflow */}
      <SectionTitle>Workflow</SectionTitle>
      <div className="flex flex-col gap-2">
        <SettingsCard
          title="Issue statuses"
          description="Customize workflow statuses for this team"
          badge={`${team.statusCount} statuses`}
        />
        <SettingsCard
          title="Workflows & automations"
          description="Git workflows, auto-assignment, and status transition rules"
        />
        <SettingsCard
          title="Triage"
          description="Enable or disable triage for incoming issues"
          badge={team.triageEnabled ? "Enabled" : "Disabled"}
        />
        <SettingsCard
          title="Cycles"
          description="Focus team over time-boxed windows"
          badge={team.cyclesEnabled ? "On" : "Off"}
        />
      </div>

      {/* AI */}
      <SectionTitle>AI</SectionTitle>
      <div className="flex flex-col gap-2">
        <SettingsCard
          title="Agents"
          description="AI agent guidance for this team"
        />
        <SettingsCard
          title="Discussion summaries"
          description="Auto-generate AI summaries of discussions"
        />
      </div>

      {/* Team hierarchy */}
      <SectionTitle>Team hierarchy</SectionTitle>
      <div className="flex flex-col gap-2">
        <SettingsCard
          title="Parent team"
          description="Set this team as a sub-team of another team"
          badge="None"
        />
      </div>

      {/* Danger zone */}
      <SectionTitle>Danger zone</SectionTitle>
      <div className="flex flex-wrap gap-2">
        <DangerButton>Leave team</DangerButton>
        <DangerButton>Retire team</DangerButton>
        <DangerButton>Delete team</DangerButton>
      </div>
    </div>
  );
}
