import { Avatar } from "@/components/avatar";
import type { DisplayProperties } from "@/components/display-options-panel";
import { PriorityIcon } from "@/components/icons/priority-icon";
import { StatusIcon } from "@/components/icons/status-icon";
import { LabelChip } from "@/components/label-chip";
import Link from "next/link";

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
  projectName?: string;
  createdAt: string;
  href?: string;
  displayProperties?: DisplayProperties;
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
  projectName,
  createdAt,
  href,
  displayProperties,
}: IssueRowProps) {
  const showProp = (key: keyof DisplayProperties) =>
    !displayProperties || displayProperties[key];

  const content = (
    <>
      {/* Priority */}
      {showProp("priority") && <PriorityIcon priority={priority} size={14} />}

      {/* Status */}
      {showProp("status") && (
        <StatusIcon category={statusCategory} color={statusColor} size={14} />
      )}

      {/* Identifier */}
      {showProp("id") && (
        <span className="shrink-0 text-[var(--color-text-secondary)]">
          {identifier}
        </span>
      )}

      {/* Title */}
      <span className="min-w-0 flex-1 truncate text-[var(--color-text-primary)]">
        {title}
      </span>

      {/* Labels */}
      {showProp("labels") && labels && labels.length > 0 && (
        <div className="flex shrink-0 items-center gap-1">
          {labels.map((l) => (
            <LabelChip key={l.name} name={l.name} color={l.color} />
          ))}
        </div>
      )}

      {/* Project */}
      {showProp("project") && projectName && (
        <span className="max-w-[160px] shrink-0 truncate text-[12px] text-[var(--color-text-secondary)]">
          {projectName}
        </span>
      )}

      {/* Date */}
      {showProp("created") && (
        <span className="shrink-0 text-[12px] text-[var(--color-text-secondary)]">
          {formatDate(createdAt)}
        </span>
      )}

      {/* Assignee */}
      {showProp("assignee") &&
        (assigneeName ? (
          <div data-testid="assignee" className="shrink-0">
            <Avatar name={assigneeName} src={assigneeImage} size="sm" />
          </div>
        ) : (
          <div className="h-4 w-4 shrink-0" />
        ))}
    </>
  );

  const className =
    "group flex h-[40px] items-center gap-2 border-b border-[var(--color-border)] px-4 text-[13px] transition-colors hover:bg-[var(--color-surface-hover)]";

  if (href) {
    return (
      <Link
        href={href}
        data-testid="issue-row"
        aria-label={`${identifier} ${title}`}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <div data-testid="issue-row" className={className}>
      {content}
    </div>
  );
}
