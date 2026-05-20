"use client";

import { useAppShellContext } from "@/app/(app)/app-shell";
import { ContextualInsights } from "@/components/contextual-insights";
import { CreateIssueModal } from "@/components/create-issue-modal";
import { CycleProgressBar } from "@/components/cycle-progress-bar";
import {
  DisplayOptionsPanel,
  type DisplayProperties,
} from "@/components/display-options-panel";
import { EmptyState } from "@/components/empty-state";
import {
  FilterBar,
  type FilterCondition,
  applyFilters,
} from "@/components/filter-bar";
import { IssueRow, priorityMap } from "@/components/issue-row";
import { IssuesGroupHeader } from "@/components/issues-group-header";
import { useDisplayOptions } from "@/hooks/use-display-options";
import { useFilters } from "@/hooks/use-filters";
import { formatCycleDate, getDateInputValue } from "@/lib/cycle-utils";
import { withWorkspaceSlug } from "@/lib/workspace-paths";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface IssueData {
  id: string;
  number: number;
  identifier: string;
  title: string;
  priority: string;
  stateId: string;
  assigneeId: string | null;
  assignee: { name: string; image?: string | null } | null;
  creatorId: string | null;
  creatorName: string | null;
  labels: { id?: string; name: string; color: string }[];
  labelIds: string[];
  projectId: string | null;
  projectName: string | null;
  cycleId: string | null;
  cycleName: string | null;
  estimate: number | null;
  dueDate: string | null;
  createdAt: string;
}

interface StateGroup {
  state: {
    id: string;
    name: string;
    category: string;
    color: string;
    position: number;
  };
  issues: IssueData[];
}

type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

interface FilterOptions {
  statuses: { id: string; name: string; category: string; color: string }[];
  assignees: { id: string; name: string; image?: string | null }[];
  labels: { id: string; name: string; color: string }[];
  projects: { id: string; name: string }[];
  creators: { id: string; name: string }[];
  cycles: { id: string; name: string }[];
  estimates: { value: string; label: string }[];
  dueDates: { value: string; label: string }[];
  priorities: { value: string; label: string }[];
}

interface CycleDetailResponse {
  team: { id: string; name: string; key: string };
  cycle: {
    id: string;
    name: string | null;
    number: number;
    startDate: string;
    endDate: string;
    autoRollover: boolean;
    issueCount: number;
    completedIssueCount: number;
  };
  groups: StateGroup[];
  filterOptions: FilterOptions;
}

function sortIssues(issues: IssueData[], orderBy: string) {
  return [...issues].sort((left, right) => {
    if (orderBy === "created" || orderBy === "updated") {
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    }

    if (orderBy === "priority") {
      return (
        (priorityMap[left.priority] ?? 0) - (priorityMap[right.priority] ?? 0)
      );
    }

    return left.number - right.number;
  });
}

export default function CycleDetailPage() {
  const params = useParams<{ key: string; cycleId: string }>();
  const router = useRouter();
  const workspaceSlug = useAppShellContext()?.workspaceSlug;
  const [data, setData] = useState<CycleDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showDisplayOptions, setShowDisplayOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { filters, updateFilters } = useFilters(
    `cycle:${params.key}:${params.cycleId}`,
  );
  const { options, updateOptions, saveAsDefault, reset } = useDisplayOptions(
    params.key,
    "list",
  );

  const cycleListPath = useCallback(
    () => withWorkspaceSlug(`/team/${params.key}/cycles`, workspaceSlug),
    [params.key, workspaceSlug],
  );

  const fetchCycleDetail = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/teams/${params.key}/cycles/${params.cycleId}`,
      );
      if (res.ok) {
        const json = (await res.json()) as CycleDetailResponse;
        setData(json);
        return;
      }

      setData(null);
      setLoadError(
        res.status === 404 ? "Cycle not found" : "Failed to load cycle",
      );
    } catch {
      setData(null);
      setLoadError("Failed to load cycle");
    } finally {
      setLoading(false);
    }
  }, [params.key, params.cycleId]);

  useEffect(() => {
    void fetchCycleDetail();
  }, [fetchCycleDetail]);

  useEffect(() => {
    function handleIssueCreated(event: Event) {
      const detail = (event as CustomEvent<{ teamKey?: string }>).detail;
      if (detail?.teamKey && detail.teamKey !== params.key) return;
      void fetchCycleDetail();
    }

    window.addEventListener("issue-created", handleIssueCreated);
    return () =>
      window.removeEventListener("issue-created", handleIssueCreated);
  }, [fetchCycleDetail, params.key]);

  const cycleName =
    data?.cycle.name ?? (data ? `Cycle ${data.cycle.number}` : "Cycle");

  const handleEditCycle = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!data) return;

      const formData = new FormData(event.currentTarget);
      setSubmittingEdit(true);
      setEditError(null);
      try {
        const res = await fetch(
          `/api/teams/${params.key}/cycles/${params.cycleId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: (formData.get("name") as string).trim() || null,
              startDate: formData.get("startDate"),
              endDate: formData.get("endDate"),
              autoRollover: formData.get("autoRollover") === "on",
            }),
          },
        );

        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Failed to update cycle");
        }

        setShowEditForm(false);
        await fetchCycleDetail();
      } catch (error) {
        setEditError(
          error instanceof Error ? error.message : "Failed to update cycle",
        );
      } finally {
        setSubmittingEdit(false);
      }
    },
    [data, fetchCycleDetail, params.key, params.cycleId],
  );

  const handleDeleteCycle = useCallback(async () => {
    if (!data) return;
    const confirmed = window.confirm(
      `Delete ${cycleName}? Issues stay in ${data.team.name} but will be removed from this cycle.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(
        `/api/teams/${params.key}/cycles/${params.cycleId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Failed to delete cycle");
      }
      router.push(cycleListPath());
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Failed to delete cycle",
      );
    } finally {
      setDeleting(false);
    }
  }, [cycleListPath, cycleName, data, params.key, params.cycleId, router]);

  const handlePropertyToggle = useCallback(
    (key: keyof DisplayProperties) => {
      updateOptions({
        displayProperties: {
          ...options.displayProperties,
          [key]: !options.displayProperties[key],
        },
      });
    },
    [options.displayProperties, updateOptions],
  );

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return (data?.groups ?? []).map((group) => {
      const filteredIssues = applyFilters(group.issues, filters).filter(
        (issueRecord) => {
          if (!normalizedSearch) return true;
          return (
            issueRecord.title.toLowerCase().includes(normalizedSearch) ||
            issueRecord.identifier.toLowerCase().includes(normalizedSearch)
          );
        },
      );

      return {
        ...group,
        issues: sortIssues(filteredIssues, options.orderBy),
      };
    });
  }, [data?.groups, filters, options.orderBy, searchQuery]);

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
        title={loadError ?? "Cycle not found"}
        description="This cycle may have been deleted."
      />
    );
  }

  const visibleGroups = filteredGroups.filter((g) => g.issues.length > 0);
  const visibleIssueCount = visibleGroups.reduce(
    (sum, group) => sum + group.issues.length,
    0,
  );
  const visibleIssueIds = visibleGroups.flatMap((group) =>
    group.issues.map((issue) => issue.id),
  );
  const isFiltered = filters.length > 0 || searchQuery.trim().length > 0;
  const defaultState =
    data.groups.find((group) => group.state.category === "backlog") ??
    data.groups[0];

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-2">
        <button
          type="button"
          onClick={() => router.push(cycleListPath())}
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
          Cycles
        </button>
        <span className="text-[var(--color-text-tertiary)]">/</span>
        <h1 className="text-[15px] font-medium text-[var(--color-text-primary)]">
          {cycleName}
        </h1>
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {formatCycleDate(data.cycle.startDate)} —{" "}
          {formatCycleDate(data.cycle.endDate)}
        </span>
        <span className="rounded-full border border-[var(--color-border)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)]">
          Auto-rollover {data.cycle.autoRollover ? "on" : "off"}
        </span>
        <div className="ml-1">
          <CycleProgressBar
            completed={data.cycle.completedIssueCount}
            total={data.cycle.issueCount}
          />
        </div>
        <div className="flex-1" />
        <ContextualInsights
          teamKey={data.team.key}
          scopedIssueIds={visibleIssueIds}
          contextLabel={cycleName}
        />
        <button
          type="button"
          onClick={() => setShowCreateIssue(true)}
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:opacity-90"
        >
          Add issue
        </button>
        <button
          type="button"
          onClick={() => {
            setEditError(null);
            setShowEditForm((current) => !current);
          }}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          Edit cycle
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={() => void handleDeleteCycle()}
          className="rounded-md px-3 py-1.5 text-[13px] text-red-400 transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {showEditForm && (
        <form
          aria-label="Edit cycle"
          onSubmit={handleEditCycle}
          className="border-b border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-3"
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[12px] text-[var(--color-text-secondary)]">
              Name
              <input
                name="name"
                type="text"
                defaultValue={data.cycle.name ?? ""}
                placeholder={`Cycle ${data.cycle.number}`}
                className="w-[220px] rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-[var(--color-text-secondary)]">
              Start
              <input
                name="startDate"
                type="date"
                defaultValue={getDateInputValue(new Date(data.cycle.startDate))}
                required
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-2 py-1.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-[12px] text-[var(--color-text-secondary)]">
              End
              <input
                name="endDate"
                type="date"
                defaultValue={getDateInputValue(new Date(data.cycle.endDate))}
                required
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-2 py-1.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-[13px] text-[var(--color-text-secondary)]">
              <input
                name="autoRollover"
                type="checkbox"
                defaultChecked={data.cycle.autoRollover}
                className="h-3.5 w-3.5 rounded border-[var(--color-border)] bg-transparent accent-[var(--color-accent)]"
              />
              Auto-rollover unfinished issues
            </label>
            <button
              type="submit"
              disabled={submittingEdit}
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {submittingEdit ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => setShowEditForm(false)}
              className="rounded-md px-3 py-1.5 text-[13px] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
          </div>
          {editError && (
            <p className="mt-2 text-[12px] text-red-400">{editError}</p>
          )}
        </form>
      )}
      {deleteError && (
        <div className="border-b border-[var(--color-border)] px-4 py-2 text-[12px] text-red-400">
          {deleteError}
        </div>
      )}

      <div className="flex min-w-0 flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-4 py-2">
        <input
          type="search"
          aria-label="Search cycle issues"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search issues"
          className="w-[220px] rounded-md border border-[var(--color-border)] bg-[var(--color-content-bg)] px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-none"
        />
        <FilterBar
          filters={filters}
          onFiltersChange={updateFilters}
          availableStatuses={data.filterOptions.statuses}
          availableLabels={data.filterOptions.labels}
          availableAssignees={data.filterOptions.assignees}
          availableProjects={data.filterOptions.projects}
          availableCreators={data.filterOptions.creators}
          availableCycles={data.filterOptions.cycles}
          availableEstimates={data.filterOptions.estimates}
          availableDueDates={data.filterOptions.dueDates}
          availablePriorities={data.filterOptions.priorities}
        />
        <div className="flex-1" />
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {visibleIssueCount} shown
        </span>
        <div className="relative">
          <button
            type="button"
            aria-label="Display options"
            onClick={() => setShowDisplayOptions(!showDisplayOptions)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            Display
          </button>
          <DisplayOptionsPanel
            open={showDisplayOptions}
            onClose={() => setShowDisplayOptions(false)}
            layout={options.layout}
            onLayoutChange={(layout) => updateOptions({ layout })}
            groupBy={options.groupBy}
            onGroupByChange={(groupBy) => updateOptions({ groupBy })}
            subGroupBy={options.subGroupBy}
            onSubGroupByChange={(subGroupBy) => updateOptions({ subGroupBy })}
            orderBy={options.orderBy}
            onOrderByChange={(orderBy) => updateOptions({ orderBy })}
            displayProperties={options.displayProperties}
            onDisplayPropertyToggle={handlePropertyToggle}
            showSubIssues={options.showSubIssues}
            onShowSubIssuesToggle={() =>
              updateOptions({ showSubIssues: !options.showSubIssues })
            }
            showTriageIssues={options.showTriageIssues}
            onShowTriageIssuesToggle={() =>
              updateOptions({ showTriageIssues: !options.showTriageIssues })
            }
            showEmptyColumns={options.showEmptyColumns}
            onShowEmptyColumnsToggle={() =>
              updateOptions({ showEmptyColumns: !options.showEmptyColumns })
            }
            onReset={reset}
            onSaveAsDefault={saveAsDefault}
          />
        </div>
      </div>

      {/* Issues grouped by status */}
      <div className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {data.cycle.issueCount === 0 && !isFiltered ? (
          <EmptyState
            title="No issues in this cycle"
            description="Create an issue directly in this cycle to start tracking scope."
            action={{
              label: "Create issue",
              onClick: () => setShowCreateIssue(true),
            }}
          />
        ) : visibleGroups.length === 0 ? (
          <EmptyState
            title="No matching issues"
            description="Adjust search or filters to see more cycle scope."
            action={{
              label: "Clear filters",
              onClick: () => {
                setSearchQuery("");
                updateFilters([] as FilterCondition[]);
              },
            }}
          />
        ) : (
          visibleGroups.map((group) => (
            <div key={group.state.id} className="group">
              <IssuesGroupHeader
                name={group.state.name}
                count={group.issues.length}
                statusCategory={group.state.category as StatusCategory}
                statusColor={group.state.color}
                onAddIssue={() => setShowCreateIssue(true)}
              />
              {group.issues.map((iss) => (
                <IssueRow
                  key={iss.id}
                  href={withWorkspaceSlug(
                    `/team/${params.key}/issue/${iss.identifier}`,
                    workspaceSlug,
                  )}
                  identifier={iss.identifier}
                  title={iss.title}
                  priority={priorityMap[iss.priority] ?? 0}
                  statusCategory={group.state.category as StatusCategory}
                  statusColor={group.state.color}
                  assigneeName={iss.assignee?.name}
                  assigneeImage={iss.assignee?.image ?? undefined}
                  labels={iss.labels}
                  projectName={iss.projectName ?? undefined}
                  dueDate={iss.dueDate}
                  createdAt={iss.createdAt}
                  displayProperties={options.displayProperties}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-[var(--color-border)] px-4 py-1.5 text-[12px] text-[var(--color-text-secondary)]">
        {data.cycle.issueCount} issues in cycle · {visibleIssueCount} shown
      </div>

      <CreateIssueModal
        open={showCreateIssue}
        onClose={() => setShowCreateIssue(false)}
        onCreated={fetchCycleDetail}
        teamKey={data.team.key}
        teamName={data.team.name}
        teamId={data.team.id}
        defaultStateId={defaultState?.state.id}
        defaultStateName={defaultState?.state.name ?? "Backlog"}
        defaultCycleId={data.cycle.id}
        defaultCycleName={cycleName}
      />
    </div>
  );
}
