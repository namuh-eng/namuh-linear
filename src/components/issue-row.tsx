import { Avatar } from "@/components/avatar";
import { PriorityIcon } from "@/components/icons/priority-icon";
import { StatusIcon } from "@/components/icons/status-icon";
import { LabelChip } from "@/components/label-chip";

type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

interface IssueRowProps {
  identifier: string;
  title: string;
  priority: 0 | 1 | 2 | 3 | 4;
  statusCategory: StatusCategory;
  statusColor: string;
  assigneeName?: string;
  assigneeImage?: string;
  labels?: { name: string; color: string }[];
  createdAt: string;
  href?: string;
}

const priorityMap: Record<string, 0 | 1 | 2 | 3 | 4> = {
  none: 0,
  urgent: 1,
  high: 2,
  medium: 3,
  low: 4,
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
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
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export { priorityMap };

export function IssueRow({
  identifier,
  title,
  priority,
  statusCategory,
  statusColor,
  assigneeName,
  assigneeImage,
  labels,
  createdAt,
  href,
}: IssueRowProps) {
  return (
    <div
      data-testid="issue-row"
      className="group flex h-[40px] items-center gap-2 border-b border-[var(--color-border)] px-4 text-[13px] transition-colors hover:bg-[var(--color-surface-hover)]"
    >
      {/* Priority */}
      <PriorityIcon priority={priority} size={14} />

      {/* Status */}
      <StatusIcon category={statusCategory} color={statusColor} size={14} />

      {/* Identifier */}
      <span className="shrink-0 text-[var(--color-text-secondary)]">
        {identifier}
      </span>

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-[var(--color-text-primary)]">
        {title}
      </span>

      {/* Labels */}
      {labels && labels.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {labels.map((l) => (
            <LabelChip key={l.name} name={l.name} color={l.color} />
          ))}
        </div>
      )}

      {/* Date */}
      <span className="shrink-0 text-[12px] text-[var(--color-text-secondary)]">
        {formatDate(createdAt)}
      </span>

      {/* Assignee */}
      {assigneeName ? (
        <div data-testid="assignee" className="shrink-0">
          <Avatar name={assigneeName} src={assigneeImage} size="sm" />
        </div>
      ) : (
        <div className="h-4 w-4 shrink-0" />
      )}
    </div>
  );
}
