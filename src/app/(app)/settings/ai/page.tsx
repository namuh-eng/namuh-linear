"use client";

import { useEffect, useMemo, useState } from "react";

type PermissionLevel = "admins" | "members" | "anyone";

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
  workspaceId: string;
  completedLast30Days: TeamCompletedStat[];
  activeIssues: TeamActiveStat[];
  period: string;
}

interface WorkspaceAiSettings {
  enabled: boolean;
  agentRunsEnabled: boolean;
  agentGuidance: string;
  agentGuidanceRole: PermissionLevel;
  canManageSettings: boolean;
  integrationBoundary: string;
}

const permissionLabels: Record<PermissionLevel, string> = {
  admins: "Admins only",
  members: "Workspace members",
  anyone: "Anyone in workspace",
};

function Toggle({
  enabled,
  disabled,
  onChange,
  label,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-[20px] w-[36px] shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        enabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function StatCard({
  title,
  value,
  unit,
}: { title: string; value: number; unit?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {title}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold text-[var(--color-text-primary)]">
          {value}
        </span>
        {unit && (
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiSettings, setAiSettings] = useState<WorkspaceAiSettings | null>(
    null,
  );
  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);
  const [agentGuidance, setAgentGuidance] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage(null);
      const [aiResponse, analyticsResponse] = await Promise.allSettled([
        fetch("/api/workspaces/current/ai", { credentials: "include" }),
        fetch("/api/analytics/workspace", { credentials: "include" }),
      ]);

      if (cancelled) return;

      if (aiResponse.status === "fulfilled" && aiResponse.value.ok) {
        const data = (await aiResponse.value.json()) as {
          ai: WorkspaceAiSettings;
        };
        setAiSettings(data.ai);
        setAgentGuidance(data.ai.agentGuidance);
      } else {
        setErrorMessage("Unable to load workspace AI settings.");
      }

      if (
        analyticsResponse.status === "fulfilled" &&
        analyticsResponse.value.ok
      ) {
        setAnalytics(
          (await analyticsResponse.value.json()) as WorkspaceAnalytics,
        );
      }

      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveAiSettings(patch: Partial<WorkspaceAiSettings>) {
    if (!aiSettings) return;
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    const optimistic = { ...aiSettings, ...patch };
    setAiSettings(optimistic);
    if (patch.agentGuidance !== undefined) {
      setAgentGuidance(patch.agentGuidance);
    }

    try {
      const res = await fetch("/api/workspaces/current/ai", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = (await res.json().catch(() => null)) as {
        ai?: WorkspaceAiSettings;
        error?: string;
      } | null;

      if (!res.ok || !payload?.ai) {
        throw new Error(payload?.error ?? "Failed to update AI settings");
      }

      setAiSettings(payload.ai);
      setAgentGuidance(payload.ai.agentGuidance);
      setSaveMessage("Workspace AI settings saved");
    } catch (error) {
      setAiSettings(aiSettings);
      setAgentGuidance(aiSettings.agentGuidance);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update AI settings",
      );
    } finally {
      setSaving(false);
    }
  }

  const totals = useMemo(() => {
    const completed =
      analytics?.completedLast30Days.reduce(
        (acc, curr) => acc + curr.completedCount,
        0,
      ) ?? 0;
    const active =
      analytics?.activeIssues.reduce(
        (acc, curr) => acc + curr.activeCount,
        0,
      ) ?? 0;
    return { completed, active };
  }, [analytics]);

  if (loading) {
    return (
      <div className="p-8 text-[var(--color-text-tertiary)]">
        Loading workspace AI settings...
      </div>
    );
  }

  if (!aiSettings) {
    return (
      <div className="max-w-[820px] rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-700 dark:text-red-300">
        {errorMessage ?? "Unable to load workspace AI settings."}
      </div>
    );
  }

  const canEdit = aiSettings.canManageSettings && !saving;

  return (
    <div className="max-w-[820px]">
      <h1 className="text-[28px] font-semibold text-[var(--color-text-primary)]">
        AI & Agents
      </h1>
      <p className="mt-3 text-[14px] text-[var(--color-text-secondary)]">
        Configure workspace-wide AI controls, shared guidance, and agent
        permissions. Analytics remain available as supporting context below.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-700 dark:text-red-300">
          {errorMessage}
        </p>
      )}
      {saveMessage && (
        <p className="mt-4 text-[13px] text-[var(--color-text-secondary)]">
          {saveMessage}
        </p>
      )}

      {!aiSettings.canManageSettings && (
        <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-[13px] leading-5 text-amber-700 dark:text-amber-300">
          You can view these settings, but only workspace admins can change
          workspace-level AI behavior.
        </div>
      )}

      <div className="mt-8 space-y-6">
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-text-primary)]">
            Workspace AI availability
          </h2>
          <div className="mt-5 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] text-[var(--color-text-primary)]">
                  Enable AI features
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  Master switch for workspace AI experiences.
                </p>
              </div>
              <Toggle
                enabled={aiSettings.enabled}
                disabled={!canEdit}
                label="Enable AI features"
                onChange={(enabled) => void saveAiSettings({ enabled })}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[13px] text-[var(--color-text-primary)]">
                  Enable agent runs
                </div>
                <p className="text-[12px] text-[var(--color-text-secondary)]">
                  Controls whether the Agent workspace can create new runs.
                </p>
              </div>
              <Toggle
                enabled={aiSettings.agentRunsEnabled}
                disabled={!canEdit || !aiSettings.enabled}
                label="Enable agent runs"
                onChange={(agentRunsEnabled) =>
                  void saveAiSettings({ agentRunsEnabled })
                }
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-text-primary)]">
            Workspace guidance and permissions
          </h2>
          <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
            Workspace guidance is added to agent run prompt configuration before
            account and team guidance.
          </p>
          <textarea
            value={agentGuidance}
            onChange={(event) => setAgentGuidance(event.target.value)}
            onBlur={() => void saveAiSettings({ agentGuidance })}
            disabled={!canEdit}
            aria-label="Workspace AI guidance"
            className="mt-4 h-36 w-full rounded-md border border-[var(--color-border)] bg-transparent p-3 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="e.g. Agents must cite evidence, avoid destructive changes, and summarize verification."
          />
          <label className="mt-4 block text-[12px] font-medium text-[var(--color-text-secondary)]">
            Team guidance edit permission
            <select
              aria-label="Team guidance edit permission"
              value={aiSettings.agentGuidanceRole}
              onChange={(event) =>
                void saveAiSettings({
                  agentGuidanceRole: event.target.value as PermissionLevel,
                })
              }
              disabled={!canEdit}
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {Object.entries(permissionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5">
          <h2 className="text-[15px] font-medium text-[var(--color-text-primary)]">
            Integration boundary
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-[var(--color-text-secondary)]">
            {aiSettings.integrationBoundary}
          </p>
        </section>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          title="Issues Completed"
          value={totals.completed}
          unit="last 30 days"
        />
        <StatCard
          title="Active Issues"
          value={totals.active}
          unit="across all teams"
        />
      </div>

      <div className="mt-10">
        <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Team Activity
        </h3>
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)]">
                <th className="px-5 py-3 font-medium text-[var(--color-text-secondary)]">
                  Team
                </th>
                <th className="px-5 py-3 font-medium text-[var(--color-text-secondary)]">
                  Active
                </th>
                <th className="px-5 py-3 font-medium text-[var(--color-text-secondary)]">
                  Completed (30d)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {analytics?.activeIssues.map((team) => {
                const completed =
                  analytics.completedLast30Days.find(
                    (c) => c.teamId === team.teamId,
                  )?.completedCount ?? 0;
                return (
                  <tr
                    key={team.teamId}
                    className="hover:bg-[var(--color-surface-hover)]"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--color-text-primary)]">
                      {team.teamName}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                      {team.activeCount}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-text-secondary)]">
                      {completed}
                    </td>
                  </tr>
                );
              })}
              {(analytics?.activeIssues.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-[var(--color-text-tertiary)]"
                  >
                    No team activity found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
