"use client";

import { StatusIcon } from "@/components/icons/status-icon";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

interface StatusItem {
  id: string;
  name: string;
  issueCount: number;
  description: string | null;
  isDefault?: boolean;
}

type StatusesByCategory = Record<StatusCategory, StatusItem[]>;

const CATEGORY_ORDER: StatusCategory[] = [
  "triage",
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
];

const CATEGORY_LABELS: Record<StatusCategory, string> = {
  triage: "Triage",
  backlog: "Backlog",
  unstarted: "Unstarted",
  started: "Started",
  completed: "Completed",
  canceled: "Canceled",
};

function formatIssueCount(count: number): string {
  if (count === 0) return "";
  if (count === 1) return "1 issue";
  return `${count} issues`;
}

function CategoryHeader({
  category,
}: {
  category: StatusCategory;
}) {
  return (
    <div className="flex items-center justify-between bg-[var(--color-surface)] px-4 py-2">
      <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
        {CATEGORY_LABELS[category]}
      </span>
      <button
        type="button"
        aria-label="Add status"
        className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

function StatusRow({
  status,
  category,
}: {
  status: StatusItem;
  category: StatusCategory;
}) {
  const countText = formatIssueCount(status.issueCount);

  return (
    <div
      data-testid="status-item"
      className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
    >
      <StatusIcon category={category} size={18} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {status.name}
          </span>
          {status.isDefault && (
            <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
              Default
            </span>
          )}
          {countText && (
            <span className="text-[12px] text-[var(--color-text-tertiary)]">
              {countText}
            </span>
          )}
        </div>
        {status.description && (
          <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            {status.description}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamIssueStatusesPage() {
  const params = useParams();
  const teamKey = params.key as string;
  const [statuses, setStatuses] = useState<StatusesByCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicateStatus, setDuplicateStatus] = useState("canceled");

  useEffect(() => {
    fetch(`/api/teams/${teamKey}/statuses`)
      .then((res) => res.json())
      .then((data) => setStatuses(data.statuses))
      .finally(() => setLoading(false));
  }, [teamKey]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!statuses) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        No statuses found
      </div>
    );
  }

  return (
    <div className="max-w-[720px]">
      <h1 className="mb-2 text-[20px] font-semibold text-[var(--color-text-primary)]">
        Issue statuses
      </h1>
      <p className="mb-6 text-[13px] text-[var(--color-text-tertiary)]">
        Issue statuses define the workflow that issues go through from start to
        completion.
      </p>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        {CATEGORY_ORDER.map((category) => (
          <div key={category}>
            <CategoryHeader category={category} />
            {(statuses[category] || []).map((status) => (
              <StatusRow key={status.id} status={status} category={category} />
            ))}
          </div>
        ))}
      </div>

      {/* Duplicate issue status selector */}
      <div className="mt-6 rounded-lg border border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-[var(--color-text-primary)]">
              Duplicate issue status
            </div>
            <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
              Status to set when an issue is marked as a duplicate
            </div>
          </div>
          <select
            value={duplicateStatus}
            onChange={(e) => setDuplicateStatus(e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[12px] text-[var(--color-text-secondary)] outline-none"
          >
            {CATEGORY_ORDER.flatMap((cat) =>
              (statuses[cat] || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              )),
            )}
          </select>
        </div>
      </div>
    </div>
  );
}
