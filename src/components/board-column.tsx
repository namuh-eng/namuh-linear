import { StatusIcon } from "@/components/icons/status-icon";

type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

interface BoardColumnProps {
  name: string;
  count: number;
  statusCategory: StatusCategory;
  statusColor: string;
  children: React.ReactNode;
}

export function BoardColumn({
  name,
  count,
  statusCategory,
  statusColor,
  children,
}: BoardColumnProps) {
  return (
    <div className="flex min-w-[280px] flex-1 flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 px-2 py-2.5">
        <StatusIcon category={statusCategory} color={statusColor} size={14} />
        <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
          {name}
        </span>
        <span className="text-[13px] text-[var(--color-text-secondary)]">
          {count}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          aria-label="Add issue"
          className="flex h-5 w-5 items-center justify-center rounded text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
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
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-2">
        {children}
      </div>
    </div>
  );
}
