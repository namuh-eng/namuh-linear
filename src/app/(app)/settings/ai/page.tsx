"use client";

import { useEffect, useState } from "react";

type PermissionLevel = "admins" | "members" | "anyone";

type WorkspaceAiSettings = {
  enabled: boolean;
  agentGuidance: string;
  usagePermission: PermissionLevel;
  issueSuggestions: boolean;
  summaries: boolean;
  autoTriage: boolean;
};

interface TeamCompletedStat {
  teamId: string;
  teamName: string;
  completedCount: number;
}

interface TeamActiveStat {
  teamId: string;
  teamName: string;
  activeCount: number;
}

interface WorkspaceAnalytics {
  completedLast30Days: TeamCompletedStat[];
  activeIssues: TeamActiveStat[];
}

const permissionLabels: Record<PermissionLevel, string> = {
  admins: "Admins only",
  members: "Workspace members",
  anyone: "Anyone except guests",
};

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <span>
        <span className="block text-[14px] font-medium text-[var(--color-text-primary)]">
          {title}
        </span>
        <span className="mt-1 block text-[13px] text-[var(--color-text-tertiary)]">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        className="h-5 w-5 accent-[var(--color-accent)]"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function StatCard({
  title,
  value,
  unit,
}: { title: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {title}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold text-[var(--color-text-primary)]">
          {value}
        </span>
        <span className="text-[13px] text-[var(--color-text-secondary)]">
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);
  const [settings, setSettings] = useState<WorkspaceAiSettings | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/workspaces/current/ai-settings").then(async (res) => {
        if (!res.ok) throw new Error("Failed to load AI settings");
        return res.json();
      }),
      fetch("/api/analytics/workspace")
        .then(async (res) =>
          res.ok ? ((await res.json()) as WorkspaceAnalytics) : null,
        )
        .catch(() => null),
    ])
      .then(([aiPayload, analyticsPayload]) => {
        setSettings(aiPayload.ai);
        setCanManage(aiPayload.capabilities.canManageAiSettings);
        setAnalytics(analyticsPayload);
      })
      .catch(() => setErrorMessage("Unable to load workspace AI settings."))
      .finally(() => setLoading(false));
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setErrorMessage(null);
    setMessage(null);
    try {
      const response = await fetch("/api/workspaces/current/ai-settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error || "Unable to save AI settings");
      setSettings(payload.ai);
      setCanManage(payload.capabilities.canManageAiSettings);
      setMessage("Workspace AI settings saved.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save AI settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="p-8 text-[var(--color-text-tertiary)]">Loading...</div>
    );
  }

  const disabled = saving || !canManage;
  const totalCompleted =
    analytics?.completedLast30Days.reduce(
      (acc, curr) => acc + curr.completedCount,
      0,
    ) ?? 0;
  const totalActive =
    analytics?.activeIssues.reduce((acc, curr) => acc + curr.activeCount, 0) ??
    0;

  return (
    <div className="max-w-[820px]">
      <h1 className="text-[28px] font-semibold text-[var(--color-text-primary)]">
        AI & Agents
      </h1>
      <p className="mt-3 text-[14px] text-[var(--color-text-secondary)]">
        Configure workspace-wide AI features and monitor agent performance.
      </p>

      {errorMessage && (
        <p className="mt-4 text-[13px] text-red-400">{errorMessage}</p>
      )}
      {message && <p className="mt-4 text-[13px] text-green-400">{message}</p>}
      {!canManage && (
        <p className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[13px] text-[var(--color-text-secondary)]">
          Only workspace admins can change AI & Agents settings.
        </p>
      )}

      <section className="mt-8 space-y-4">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Workspace controls
        </h2>
        <ToggleRow
          title="Enable AI agents"
          description="Allow assistant and agent entry points in this workspace."
          checked={settings.enabled}
          disabled={disabled}
          onChange={(enabled) => setSettings({ ...settings, enabled })}
        />
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <label
            className="text-[14px] font-medium text-[var(--color-text-primary)]"
            htmlFor="ai-usage-permission"
          >
            Who can use AI agents
          </label>
          <select
            id="ai-usage-permission"
            className="mt-3 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[14px] text-[var(--color-text-primary)]"
            value={settings.usagePermission}
            disabled={disabled}
            onChange={(event) =>
              setSettings({
                ...settings,
                usagePermission: event.target.value as PermissionLevel,
              })
            }
          >
            {Object.entries(permissionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <label
            className="text-[14px] font-medium text-[var(--color-text-primary)]"
            htmlFor="workspace-agent-guidance"
          >
            Workspace agent guidance
          </label>
          <p className="mt-1 text-[13px] text-[var(--color-text-tertiary)]">
            Applied to agent runs alongside personal and team guidance.
          </p>
          <textarea
            id="workspace-agent-guidance"
            className="mt-3 min-h-28 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[14px] text-[var(--color-text-primary)]"
            maxLength={4000}
            value={settings.agentGuidance}
            disabled={disabled}
            onChange={(event) =>
              setSettings({ ...settings, agentGuidance: event.target.value })
            }
          />
        </div>
        <ToggleRow
          title="Issue suggestions"
          description="Allow AI suggestions while creating or refining issues."
          checked={settings.issueSuggestions}
          disabled={disabled}
          onChange={(issueSuggestions) =>
            setSettings({ ...settings, issueSuggestions })
          }
        />
        <ToggleRow
          title="AI summaries"
          description="Allow generated summaries for issues and workspace activity."
          checked={settings.summaries}
          disabled={disabled}
          onChange={(summaries) => setSettings({ ...settings, summaries })}
        />
        <ToggleRow
          title="Auto-triage"
          description="Allow agents to propose triage metadata for new work."
          checked={settings.autoTriage}
          disabled={disabled}
          onChange={(autoTriage) => setSettings({ ...settings, autoTriage })}
        />
        <button
          type="button"
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={saveSettings}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </section>

      <section className="mt-10">
        <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Usage
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title="Issues Completed"
            value={totalCompleted}
            unit="last 30 days"
          />
          <StatCard
            title="Active Issues"
            value={totalActive}
            unit="across all teams"
          />
        </div>
      </section>
    </div>
  );
}
