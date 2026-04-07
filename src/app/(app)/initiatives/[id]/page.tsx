"use client";

import { EmptyState } from "@/components/empty-state";
import { InitiativeHealthBadge } from "@/components/initiative-health-badge";
import { InitiativeProjectList } from "@/components/initiative-project-list";
import { InitiativeStatusBadge } from "@/components/initiative-status-badge";
import type { InitiativeUpdateHealth } from "@/lib/initiative-detail";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface LinkedProject {
  id: string;
  name: string;
  status: string;
  icon: string | null;
  slug: string;
  completedIssueCount: number;
  issueCount: number;
}

interface AvailableProject {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
  status: string;
}

interface InitiativeUpdate {
  id: string;
  health: InitiativeUpdateHealth;
  body: string;
  actorName: string;
  actorImage: string | null;
  createdAt: string;
}

interface InitiativeDetailResponse {
  initiative: {
    id: string;
    name: string;
    description: string | null;
    status: "active" | "planned" | "completed";
    projectCount: number;
    completedProjectCount: number;
    createdAt: string;
    updatedAt: string;
  };
  projects: LinkedProject[];
  availableProjects: AvailableProject[];
  updates: InitiativeUpdate[];
}

function formatUpdateDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function InitiativeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<InitiativeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [updateDraft, setUpdateDraft] = useState("");
  const [updateHealth, setUpdateHealth] =
    useState<InitiativeUpdateHealth>("onTrack");
  const [saving, setSaving] = useState(false);
  const [unlinkingProjectId, setUnlinkingProjectId] = useState<string | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/initiatives/${params.id}`);
      if (!res.ok) {
        setData(null);
        return;
      }
      const json = (await res.json()) as InitiativeDetailResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (
      data.availableProjects.length > 0 &&
      !data.availableProjects.some(
        (project) => project.id === selectedProjectId,
      )
    ) {
      setSelectedProjectId(data.availableProjects[0].id);
      return;
    }

    if (data.availableProjects.length === 0 && selectedProjectId) {
      setSelectedProjectId("");
    }
  }, [data, selectedProjectId]);

  const completionPercent = useMemo(() => {
    if (!data || data.initiative.projectCount === 0) {
      return 0;
    }

    return Math.round(
      (data.initiative.completedProjectCount / data.initiative.projectCount) *
        100,
    );
  }, [data]);

  const patchInitiative = useCallback(
    async (payload: Record<string, unknown>) => {
      setSaving(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/initiatives/${params.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
          setErrorMessage(json.error ?? "Unable to update initiative.");
          return false;
        }

        setData(json);
        return true;
      } catch {
        setErrorMessage("Unable to update initiative.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [params.id],
  );

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this initiative? Linked project mappings will be removed.",
      )
    ) {
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/initiatives/${params.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setErrorMessage(json?.error ?? "Unable to delete initiative.");
        return;
      }

      router.push("/initiatives");
    } catch {
      setErrorMessage("Unable to delete initiative.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUnlink(projectId: string) {
    setUnlinkingProjectId(projectId);
    const success = await patchInitiative({ removeProjectId: projectId });
    if (success && selectedProjectId === "") {
      await fetchDetail();
    }
    setUnlinkingProjectId(null);
  }

  async function handlePostUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const success = await patchInitiative({
      initiativeUpdate: updateDraft,
      updateHealth,
    });

    if (success) {
      setUpdateDraft("");
      setUpdateHealth("onTrack");
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Initiative not found"
        description="This initiative may have been deleted."
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-2">
        <button
          type="button"
          onClick={() => router.push("/initiatives")}
          className="flex items-center gap-1 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Initiatives
        </button>
        <span className="text-[var(--color-text-tertiary)]">/</span>
        <h1 className="text-[15px] font-medium text-[var(--color-text-primary)]">
          {data.initiative.name}
        </h1>
        <InitiativeStatusBadge status={data.initiative.status} />
        <div className="flex-1" />
        <label className="flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)]">
          <span>Status</span>
          <select
            aria-label="Initiative status"
            value={data.initiative.status}
            onChange={(event) => {
              void patchInitiative({ status: event.target.value });
            }}
            disabled={saving}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-60"
          >
            <option value="active">Active</option>
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={saving}
          className="rounded-md px-3 py-1.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:text-rose-300 disabled:opacity-60"
        >
          Delete
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {data.initiative.description && (
          <div className="border-b border-[var(--color-border)] px-4 py-4">
            <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {data.initiative.description}
            </p>
          </div>
        )}

        {errorMessage ? (
          <div className="border-b border-[var(--color-border)] px-4 py-3 text-[12px] text-rose-300">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3">
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            Progress
          </span>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                style={{
                  width: `${completionPercent}%`,
                }}
              />
            </div>
            <span className="text-[12px] text-[var(--color-text-tertiary)]">
              {data.initiative.completedProjectCount} /{" "}
              {data.initiative.projectCount} projects completed
            </span>
          </div>
        </div>

        <div className="border-b border-[var(--color-border)] px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-medium text-[var(--color-text-primary)]">
                Linked projects
              </h2>
              <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
                Initiatives track progress across the projects that contribute
                to the goal.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Available projects"
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(event.target.value)}
                disabled={saving || data.availableProjects.length === 0}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-60"
              >
                {data.availableProjects.length === 0 ? (
                  <option value="">No projects left to link</option>
                ) : (
                  data.availableProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() =>
                  void patchInitiative({ addProjectId: selectedProjectId })
                }
                disabled={saving || !selectedProjectId}
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Link project
              </button>
            </div>
          </div>
          <InitiativeProjectList
            projects={data.projects}
            onUnlink={(projectId) => {
              void handleUnlink(projectId);
            }}
            unlinkingProjectId={unlinkingProjectId}
          />
        </div>

        <div className="px-4 py-4">
          <div className="mb-3">
            <h2 className="text-[13px] font-medium text-[var(--color-text-primary)]">
              Status updates
            </h2>
            <p className="mt-1 text-[12px] text-[var(--color-text-tertiary)]">
              Share progress, blockers, or the next checkpoint for this
              initiative.
            </p>
          </div>

          <form
            onSubmit={handlePostUpdate}
            className="mb-4 rounded-xl border border-[var(--color-border)] p-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <label
                htmlFor="initiative-update-health"
                className="text-[12px] text-[var(--color-text-secondary)]"
              >
                Health
              </label>
              <select
                id="initiative-update-health"
                aria-label="Initiative update health"
                value={updateHealth}
                onChange={(event) =>
                  setUpdateHealth(event.target.value as InitiativeUpdateHealth)
                }
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="onTrack">On track</option>
                <option value="atRisk">At risk</option>
                <option value="offTrack">Off track</option>
              </select>
            </div>
            <textarea
              value={updateDraft}
              onChange={(event) => setUpdateDraft(event.target.value)}
              rows={3}
              placeholder="Post the latest initiative update."
              className="mb-3 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-2 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={saving || !updateDraft.trim()}
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Post update"}
            </button>
          </form>

          {data.updates.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] px-4 py-5 text-[13px] text-[var(--color-text-tertiary)]">
              No updates yet.
            </p>
          ) : (
            <div className="space-y-3">
              {data.updates.map((update) => (
                <article
                  key={update.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-content-bg)] p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <InitiativeHealthBadge health={update.health} />
                      <span className="text-[12px] text-[var(--color-text-secondary)]">
                        {update.actorName}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">
                      {formatUpdateDate(update.createdAt)}
                    </span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                    {update.body}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
