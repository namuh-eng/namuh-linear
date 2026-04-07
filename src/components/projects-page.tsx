"use client";

import { EmptyState } from "@/components/empty-state";
import { ProjectRow } from "@/components/project-row";
import { useProjectViewState } from "@/hooks/use-project-view-state";
import { useCallback, useEffect, useState } from "react";

interface ProjectData {
  id: string;
  name: string;
  icon: string | null;
  slug: string;
  status: "planned" | "started" | "paused" | "completed" | "canceled";
  priority: "none" | "urgent" | "high" | "medium" | "low";
  health: string;
  lead: { name: string; image?: string | null } | null;
  teams: { id: string; key: string; name: string }[];
  targetDate: string | null;
  progress: number;
  createdAt: string;
}

type ProjectStatus = ProjectData["status"];
type StatusFilter = "all" | ProjectStatus;
type SortOption =
  | "created-desc"
  | "created-asc"
  | "name-asc"
  | "progress-desc"
  | "target-date-asc";

function compareTargetDates(left: string | null, right: string | null): number {
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return new Date(left).getTime() - new Date(right).getTime();
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { state: viewState, updateState } = useProjectViewState("workspace");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          description: formData.get("description"),
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        await fetchProjects();
      }
    },
    [fetchProjects],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex h-full flex-col">
        {showCreateForm ? (
          <form
            onSubmit={handleCreate}
            className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3"
          >
            <div className="flex flex-col gap-3">
              <input
                name="name"
                type="text"
                placeholder="Project name"
                required
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              <textarea
                name="description"
                placeholder="Description (optional)"
                rows={2}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:opacity-90"
                >
                  Create project
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-md px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <EmptyState
            title="No projects"
            description="Projects are time-bound deliverables that group issues across teams. Create one to start tracking progress."
            icon={
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b6f76"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
                aria-label="Projects"
              >
                <path d="M2 17 12 22 22 17" />
                <path d="M2 12 12 17 22 12" />
                <path d="M12 2 2 7 12 12 22 7Z" />
              </svg>
            }
            action={{
              label: "Create project",
              onClick: () => setShowCreateForm(true),
            }}
          />
        )}
      </div>
    );
  }

  const filteredProjects = projects.filter((project) => {
    if (
      viewState.teamId &&
      !project.teams.some((team) => team.id === viewState.teamId)
    ) {
      return false;
    }

    return viewState.statusFilter === "all"
      ? true
      : project.status === viewState.statusFilter;
  });

  const visibleProjects = [...filteredProjects].sort((left, right) => {
    switch (viewState.sortBy) {
      case "created-asc":
        return (
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime()
        );
      case "name-asc":
        return left.name.localeCompare(right.name);
      case "progress-desc":
        return right.progress - left.progress;
      case "target-date-asc":
        return compareTargetDates(left.targetDate, right.targetDate);
      default:
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
    }
  });

  const activeTeamName = viewState.teamId
    ? (projects
        .flatMap((project) => project.teams)
        .find((team) => team.id === viewState.teamId)?.name ?? null)
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-[var(--color-border)] px-4 py-2">
        <h1 className="mr-4 text-[15px] font-medium text-[var(--color-text-primary)]">
          Projects
        </h1>
        <div className="flex items-center gap-0.5">
          <span className="rounded-md bg-[var(--color-surface-active)] px-2.5 py-1 text-[13px] text-[var(--color-text-primary)]">
            All projects
          </span>
        </div>
        <div className="flex-1" />
        <label className="mr-2 flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)]">
          <span>Status</span>
          <select
            aria-label="Filter projects by status"
            value={viewState.statusFilter}
            onChange={(event) =>
              updateState({
                statusFilter: event.target.value as StatusFilter,
              })
            }
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="planned">Planned</option>
            <option value="started">In progress</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
          </select>
        </label>
        <label className="mr-3 flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)]">
          <span>Sort</span>
          <select
            aria-label="Sort projects"
            value={viewState.sortBy}
            onChange={(event) =>
              updateState({ sortBy: event.target.value as SortOption })
            }
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="created-desc">Newest</option>
            <option value="created-asc">Oldest</option>
            <option value="name-asc">Name</option>
            <option value="progress-desc">Progress</option>
            <option value="target-date-asc">Target date</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="mr-3 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:opacity-90"
        >
          New project
        </button>
        {activeTeamName && (
          <button
            type="button"
            onClick={() => updateState({ teamId: null })}
            className="mr-3 rounded-md border border-[var(--color-border)] px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            {activeTeamName} only
          </button>
        )}
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {visibleProjects.length} of {projects.length} projects
        </span>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3"
        >
          <div className="flex flex-col gap-3">
            <input
              name="name"
              type="text"
              placeholder="Project name"
              required
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <textarea
              name="description"
              placeholder="Description (optional)"
              rows={2}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:opacity-90"
              >
                Create project
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-md px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex h-[32px] items-center border-b border-[var(--color-border)] px-4 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
        <div className="min-w-0 flex-1">Name</div>
        <div className="w-[120px] shrink-0">Health</div>
        <div className="w-[60px] shrink-0 text-center">Priority</div>
        <div className="w-[60px] shrink-0 text-center">Lead</div>
        <div className="w-[80px] shrink-0">Target date</div>
        <div className="w-[70px] shrink-0">Status</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {visibleProjects.length > 0 ? (
          visibleProjects.map((project) => (
            <ProjectRow
              key={project.id}
              name={project.name}
              icon={project.icon}
              slug={project.slug}
              status={project.status}
              priority={project.priority}
              health={project.health}
              lead={
                project.lead
                  ? {
                      name: project.lead.name,
                      image: project.lead.image ?? undefined,
                    }
                  : null
              }
              targetDate={project.targetDate}
              progress={project.progress}
            />
          ))
        ) : (
          <EmptyState
            title="No matching projects"
            description="Try a different status filter or sort order."
            action={{
              label: "Reset filters",
              onClick: () =>
                updateState({
                  statusFilter: "all",
                  sortBy: "created-desc",
                  teamId: null,
                }),
            }}
          />
        )}
      </div>

      <div className="flex items-center border-t border-[var(--color-border)] px-4 py-1.5 text-[12px] text-[var(--color-text-secondary)]">
        {visibleProjects.length} visible
      </div>
    </div>
  );
}
