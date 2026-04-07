import { Avatar } from "@/components/avatar";
import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";

interface TriageIssue {
  id: string;
  identifier: string;
  title: string;
  creatorName: string;
  creatorImage: string | null;
  createdAt: string;
  priority: string;
  labels: { name: string; color: string }[];
}

interface TriageRowProps {
  issue: TriageIssue;
  onAccept: (issueId: string) => void;
  onDecline: (issueId: string) => void;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const minuteDiff = differenceInMinutes(now, date);

  if (minuteDiff < 1) {
    return "just now";
  }

  if (minuteDiff < 60) {
    return `${minuteDiff}m ago`;
  }

  const hourDiff = differenceInHours(now, date);
  if (hourDiff < 24) {
    return `${hourDiff}h ago`;
  }

  const dayDiff = differenceInDays(now, date);
  if (dayDiff < 30) {
    return `${dayDiff}d ago`;
  }

  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function TriageRow({ issue, onAccept, onDecline }: TriageRowProps) {
  return (
    <div
      data-testid="triage-row"
      className="group flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-2.5 transition-colors hover:bg-[var(--color-surface-hover)]"
    >
      {/* Triage status icon */}
      <div className="flex h-4 w-4 shrink-0 items-center justify-center">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="var(--color-status-triage)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        </svg>
      </div>

      {/* Identifier */}
      <span className="shrink-0 text-[13px] text-[var(--color-text-secondary)]">
        {issue.identifier}
      </span>

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-text-primary)]">
        {issue.title}
      </span>

      {/* Creator */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Avatar
          name={issue.creatorName}
          src={issue.creatorImage ?? undefined}
          size="sm"
        />
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {issue.creatorName}
        </span>
      </div>

      {/* Date */}
      <span className="shrink-0 text-[12px] text-[var(--color-text-tertiary)]">
        {formatDate(issue.createdAt)}
      </span>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label="Accept issue"
          onClick={() => onAccept(issue.id)}
          className="flex h-6 w-6 items-center justify-center rounded text-green-400 transition-colors hover:bg-green-400/10"
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
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Decline issue"
          onClick={() => onDecline(issue.id)}
          className="flex h-6 w-6 items-center justify-center rounded text-red-400 transition-colors hover:bg-red-400/10"
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
