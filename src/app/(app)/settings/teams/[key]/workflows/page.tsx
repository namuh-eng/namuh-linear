"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

type WorkflowTrigger =
  | "issue_created"
  | "branch_created"
  | "pull_request_merged"
  | "issue_assigned";

type WorkflowState = {
  id: string;
  name: string;
  category: string;
};

type TransitionRule = {
  id: string;
  name: string;
  trigger: WorkflowTrigger;
  sourceStatusId: string | null;
  targetStatusId: string;
  enabled: boolean;
};

type WorkflowAutomation = {
  gitBranchFormat: string;
  gitBranchAutomationEnabled: boolean;
  gitPrAutomationEnabled: boolean;
  gitBranchCreateTargetStatusId: string | null;
  gitPrMergeTargetStatusId: string | null;
  autoAssignEnabled: boolean;
  autoAssignMode: "creator" | "team_lead" | "round_robin" | "none";
  defaultAssigneeId: string | null;
  statusTransitionRules: TransitionRule[];
};

interface TeamWorkflowData {
  name: string;
  detailedHistory: boolean;
  workflowStates: WorkflowState[];
  workflowAutomation: WorkflowAutomation;
}

const defaultAutomation: WorkflowAutomation = {
  gitBranchFormat: "{teamKey}-{issueNumber}-{issueTitle}",
  gitBranchAutomationEnabled: false,
  gitPrAutomationEnabled: false,
  gitBranchCreateTargetStatusId: null,
  gitPrMergeTargetStatusId: null,
  autoAssignEnabled: false,
  autoAssignMode: "none",
  defaultAssigneeId: null,
  statusTransitionRules: [],
};

const triggerLabels: Record<WorkflowTrigger, string> = {
  issue_created: "Issue created",
  branch_created: "Git branch created",
  pull_request_merged: "Pull request merged",
  issue_assigned: "Issue assigned",
};

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full transition-colors ${
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

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[12px] font-medium text-[var(--color-text-secondary)]">
      {children}
    </span>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--color-border)] p-4">
      <div className="mb-4">
        <h2 className="text-[14px] font-medium text-[var(--color-text-primary)]">
          {title}
        </h2>
        <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function StatusSelect({
  label,
  value,
  states,
  includeAny = false,
  onChange,
}: {
  label: string;
  value: string | null;
  states: WorkflowState[];
  includeAny?: boolean;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      <select
        aria-label={label}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1.5 text-[13px] text-[var(--color-text-primary)]"
      >
        <option value="">
          {includeAny ? "Any status" : "Select a status"}
        </option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name} ({state.category})
          </option>
        ))}
      </select>
    </div>
  );
}

function normalizeAutomation(team: TeamWorkflowData): WorkflowAutomation {
  return {
    ...defaultAutomation,
    ...team.workflowAutomation,
    statusTransitionRules: team.workflowAutomation?.statusTransitionRules ?? [],
  };
}

export default function TeamWorkflowsSettingsPage() {
  const params = useParams();
  const teamKey = params.key as string;
  const workspaceSlug = params.workspaceSlug as string | undefined;
  const [team, setTeam] = useState<TeamWorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailedHistory, setDetailedHistory] = useState(false);
  const [automation, setAutomation] =
    useState<WorkflowAutomation>(defaultAutomation);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [automationError, setAutomationError] = useState<string | null>(null);

  const states = team?.workflowStates ?? [];
  const backHref = workspaceSlug
    ? `/${encodeURIComponent(workspaceSlug)}/settings/teams/${encodeURIComponent(teamKey)}`
    : `/settings/teams/${encodeURIComponent(teamKey)}`;

  const rulesSummary = useMemo(() => {
    if (automation.statusTransitionRules.length === 0) {
      return "No status transition rules configured";
    }
    return `${automation.statusTransitionRules.length} status transition rule${
      automation.statusTransitionRules.length === 1 ? "" : "s"
    } configured`;
  }, [automation.statusTransitionRules.length]);

  useEffect(() => {
    fetch(`/api/teams/${teamKey}/settings`)
      .then((res) => res.json())
      .then((data) => {
        setTeam(data.team);
        if (data.team) {
          setDetailedHistory(data.team.detailedHistory);
          setAutomation(normalizeAutomation(data.team));
        }
      })
      .finally(() => setLoading(false));
  }, [teamKey]);

  function updateAutomation(patch: Partial<WorkflowAutomation>) {
    setAutomation((current) => ({ ...current, ...patch }));
    setAutomationError(null);
    setSaveMessage(null);
  }

  function updateRule(id: string, patch: Partial<TransitionRule>) {
    updateAutomation({
      statusTransitionRules: automation.statusTransitionRules.map((rule) =>
        rule.id === id ? { ...rule, ...patch } : rule,
      ),
    });
  }

  function addRule() {
    const nextNumber = automation.statusTransitionRules.length + 1;
    updateAutomation({
      statusTransitionRules: [
        ...automation.statusTransitionRules,
        {
          id: `rule-${Date.now()}`,
          name: `Transition rule ${nextNumber}`,
          trigger: "issue_created",
          sourceStatusId: null,
          targetStatusId: states[0]?.id ?? "",
          enabled: true,
        },
      ],
    });
  }

  function deleteRule(id: string) {
    updateAutomation({
      statusTransitionRules: automation.statusTransitionRules.filter(
        (rule) => rule.id !== id,
      ),
    });
  }

  async function handleSaveDetailed(nextEnabled: boolean) {
    setDetailedHistory(nextEnabled);
    setSaving(true);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/teams/${teamKey}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detailedHistory: nextEnabled }),
      });

      if (!res.ok) {
        throw new Error("Failed to save workflow settings");
      }

      setSaveMessage("Workflow settings updated");
    } catch (_error) {
      setSaveMessage("Failed to update workflow settings");
    } finally {
      setSaving(false);
    }
  }

  function validateAutomation() {
    if (!automation.gitBranchFormat.trim()) {
      return "Git branch format is required";
    }
    const missingTarget = automation.statusTransitionRules.some(
      (rule) => !rule.targetStatusId,
    );
    if (missingTarget) {
      return "Select a target status for every transition rule";
    }
    return null;
  }

  async function handleSaveAutomation() {
    const validationError = validateAutomation();
    if (validationError) {
      setAutomationError(validationError);
      return;
    }

    setSaving(true);
    setAutomationError(null);
    setSaveMessage(null);

    try {
      const res = await fetch(`/api/teams/${teamKey}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowAutomation: automation }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to save workflow settings");
      }

      if (data?.team) {
        setTeam(data.team);
        setAutomation(normalizeAutomation(data.team));
      }
      setSaveMessage("Workflow automation updated");
    } catch (error) {
      setAutomationError(
        error instanceof Error
          ? error.message
          : "Failed to update workflow settings",
      );
    } finally {
      setSaving(false);
    }
  }

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
    <div className="max-w-[820px]">
      <div className="mb-6">
        <Link
          href={backHref}
          className="text-[12px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          Back to team settings
        </Link>
      </div>

      <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
        Workflows & automations
      </h1>
      <p className="mt-2 text-[13px] text-[var(--color-text-tertiary)]">
        Manage Git workflows, auto-assignment, status transition rules, and
        audit behaviors for {team.name}.
      </p>

      <div className="mt-8 space-y-4">
        <SettingsCard
          title="Git workflows"
          description="Automate branch naming and status movement when engineers create branches or merge pull requests."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <FieldLabel>Branch name format</FieldLabel>
              <input
                aria-label="Branch name format"
                value={automation.gitBranchFormat}
                onChange={(event) =>
                  updateAutomation({ gitBranchFormat: event.target.value })
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1.5 text-[13px] text-[var(--color-text-primary)]"
              />
              <p className="text-[11px] text-[var(--color-text-tertiary)]">
                Supports {"{teamKey}"}, {"{issueNumber}"}, and {"{issueTitle}"}.
              </p>
            </div>
            <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3">
              <div>
                <div className="text-[13px] text-[var(--color-text-primary)]">
                  Move issue when branch is created
                </div>
                <div className="text-[12px] text-[var(--color-text-tertiary)]">
                  Link branch creation to workflow progress
                </div>
              </div>
              <Toggle
                enabled={automation.gitBranchAutomationEnabled}
                onChange={(value) =>
                  updateAutomation({ gitBranchAutomationEnabled: value })
                }
                label="Move issue when branch is created"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3">
              <div>
                <div className="text-[13px] text-[var(--color-text-primary)]">
                  Move issue when pull request merges
                </div>
                <div className="text-[12px] text-[var(--color-text-tertiary)]">
                  Complete or advance linked issues automatically
                </div>
              </div>
              <Toggle
                enabled={automation.gitPrAutomationEnabled}
                onChange={(value) =>
                  updateAutomation({ gitPrAutomationEnabled: value })
                }
                label="Move issue when pull request merges"
              />
            </div>
            <StatusSelect
              label="Branch creation target status"
              value={automation.gitBranchCreateTargetStatusId}
              states={states}
              onChange={(value) =>
                updateAutomation({ gitBranchCreateTargetStatusId: value })
              }
            />
            <StatusSelect
              label="Pull request merge target status"
              value={automation.gitPrMergeTargetStatusId}
              states={states}
              onChange={(value) =>
                updateAutomation({ gitPrMergeTargetStatusId: value })
              }
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Auto-assignment"
          description="Choose who owns newly created team issues by default."
        >
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-3">
              <div>
                <div className="text-[13px] text-[var(--color-text-primary)]">
                  Enable auto-assignment
                </div>
                <div className="text-[12px] text-[var(--color-text-tertiary)]">
                  Apply a default assignment strategy to new team issues
                </div>
              </div>
              <Toggle
                enabled={automation.autoAssignEnabled}
                onChange={(value) =>
                  updateAutomation({
                    autoAssignEnabled: value,
                    autoAssignMode: value ? automation.autoAssignMode : "none",
                  })
                }
                label="Enable auto-assignment"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Assignment mode</FieldLabel>
              <select
                aria-label="Assignment mode"
                value={automation.autoAssignMode}
                onChange={(event) =>
                  updateAutomation({
                    autoAssignMode: event.target
                      .value as WorkflowAutomation["autoAssignMode"],
                    autoAssignEnabled: event.target.value !== "none",
                  })
                }
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1.5 text-[13px] text-[var(--color-text-primary)]"
              >
                <option value="none">No default assignment</option>
                <option value="creator">Assign to issue creator</option>
                <option value="team_lead">Assign to team lead</option>
                <option value="round_robin">Round-robin team members</option>
              </select>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          title="Status transition rules"
          description="Create rules that move issues between statuses when team automation events occur."
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] text-[var(--color-text-tertiary)]">
              {rulesSummary}
            </p>
            <button
              type="button"
              onClick={addRule}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]"
            >
              Add transition rule
            </button>
          </div>

          <div className="space-y-3">
            {automation.statusTransitionRules.map((rule, index) => (
              <div
                key={rule.id}
                className="rounded-md border border-[var(--color-border)] p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <input
                    aria-label={`Rule ${index + 1} name`}
                    value={rule.name}
                    onChange={(event) =>
                      updateRule(rule.id, { name: event.target.value })
                    }
                    className="min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1.5 text-[13px] text-[var(--color-text-primary)]"
                  />
                  <Toggle
                    enabled={rule.enabled}
                    onChange={(value) =>
                      updateRule(rule.id, { enabled: value })
                    }
                    label={`Enable ${rule.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => deleteRule(rule.id)}
                    className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    Delete
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <FieldLabel>Rule trigger</FieldLabel>
                    <select
                      aria-label={`Rule ${index + 1} trigger`}
                      value={rule.trigger}
                      onChange={(event) =>
                        updateRule(rule.id, {
                          trigger: event.target.value as WorkflowTrigger,
                        })
                      }
                      className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1.5 text-[13px] text-[var(--color-text-primary)]"
                    >
                      {Object.entries(triggerLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <StatusSelect
                    label={`Rule ${index + 1} source status`}
                    value={rule.sourceStatusId}
                    states={states}
                    includeAny
                    onChange={(value) =>
                      updateRule(rule.id, { sourceStatusId: value })
                    }
                  />
                  <StatusSelect
                    label={`Rule ${index + 1} target status`}
                    value={rule.targetStatusId}
                    states={states}
                    onChange={(value) =>
                      updateRule(rule.id, { targetStatusId: value ?? "" })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard
          title="Detailed history/audit trail"
          description="Keep issue activity history at audit-level detail."
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13px] text-[var(--color-text-primary)]">
                Enable detailed issue history
              </div>
              <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
                Track all changes to issues with audit-level detail
              </div>
            </div>
            <Toggle
              enabled={detailedHistory}
              onChange={handleSaveDetailed}
              label="Enable detailed issue history"
            />
          </div>
        </SettingsCard>
      </div>

      {automationError && (
        <p className="mt-4 text-[12px] text-red-500">{automationError}</p>
      )}
      {saveMessage && (
        <p className="mt-4 text-[12px] text-[var(--color-text-secondary)]">
          {saveMessage}
        </p>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSaveAutomation}
          className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save automation settings"}
        </button>
      </div>
    </div>
  );
}
