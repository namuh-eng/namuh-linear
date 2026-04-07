import { Avatar } from "@/components/avatar";
import { PriorityIcon } from "@/components/icons/priority-icon";
import { LabelChip } from "@/components/label-chip";

type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

interface IssueCardProps {
  issueId?: string;
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
  draggable?: boolean;
  isDragging?: boolean;
  onDragStart?: React.DragEventHandler<HTMLDivElement>;
  onDragEnd?: React.DragEventHandler<HTMLDivElement>;
}

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

export function IssueCard({
  issueId,
  identifier,
  title,
  priority,
  assigneeName,
  assigneeImage,
  labels,
  createdAt,
  draggable = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: IssueCardProps) {
  return (
    <div
      data-testid="issue-card"
      data-issue-id={issueId}
      draggable={draggable}
      aria-grabbed={draggable ? isDragging : undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-hover)] ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-60" : ""}`}
    >
      {/* Title */}
      <p className="mb-2 text-[13px] leading-snug text-[var(--color-text-primary)]">
        {title}
      </p>

      {/* Bottom row: identifier, priority, labels, assignee */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {identifier}
        </span>

        <PriorityIcon priority={priority} size={14} />

        {/* Labels */}
        {labels && labels.length > 0 && (
          <div className="flex items-center gap-1">
            {labels.map((l) => (
              <LabelChip key={l.name} name={l.name} color={l.color} />
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Date */}
        <span className="text-[11px] text-[var(--color-text-tertiary)]">
          {formatDate(createdAt)}
        </span>

        {/* Assignee */}
        {assigneeName && (
          <div data-testid="card-assignee">
            <Avatar name={assigneeName} src={assigneeImage} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
