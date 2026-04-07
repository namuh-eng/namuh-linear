"use client";

import { Avatar } from "@/components/avatar";
import { PriorityIcon } from "@/components/icons/priority-icon";
import { LabelChip } from "@/components/label-chip";

type ProjectStatus =
  | "planned"
  | "started"
  | "paused"
  | "completed"
  | "canceled";

const statusLabels: Record<ProjectStatus, string> = {
  planned: "Planned",
  started: "In Progress",
  paused: "Paused",
  completed: "Completed",
  canceled: "Canceled",
};

const priorityLabels: Record<string, string> = {
  none: "No priority",
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

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

function PropertyRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-2">
      <span className="w-[80px] shrink-0 text-[13px] text-[var(--color-text-secondary)]">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-[var(--color-text-primary)]">
        {children}
      </div>
    </div>
  );
}

export interface ProjectPropertiesProps {
  status: ProjectStatus;
  priority: string;
  lead: { name: string; image?: string } | null;
  members: { name: string; image?: string }[];
  startDate: string | null;
  targetDate: string | null;
  teams: { name: string; key: string }[];
  labels: { name: string; color: string }[];
}

export function ProjectProperties({
  status,
  priority,
  lead,
  members,
  startDate,
  targetDate,
  teams,
  labels,
}: ProjectPropertiesProps) {
  return (
    <div className="border-l border-[var(--color-border)] pl-6">
      <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
        Properties
      </h3>

      <PropertyRow label="Status">
        <span>{statusLabels[status]}</span>
      </PropertyRow>

      <PropertyRow label="Priority">
        <PriorityIcon priority={priorityMap[priority] ?? 0} size={14} />
        <span>{priorityLabels[priority] ?? priority}</span>
      </PropertyRow>

      <PropertyRow label="Lead">
        {lead ? (
          <>
            <Avatar name={lead.name} src={lead.image} size="sm" />
            <span>{lead.name}</span>
          </>
        ) : (
          <span className="text-[var(--color-text-secondary)]">Add lead</span>
        )}
      </PropertyRow>

      <PropertyRow label="Members">
        {members.length > 0 ? (
          <div className="flex -space-x-1">
            {members.map((m) => (
              <Avatar key={m.name} name={m.name} src={m.image} size="sm" />
            ))}
          </div>
        ) : (
          <span className="text-[var(--color-text-secondary)]">
            Add members
          </span>
        )}
      </PropertyRow>

      <PropertyRow label="Dates">
        {startDate || targetDate ? (
          <span>
            {startDate ? formatDate(startDate) : "Start"}
            {" → "}
            {targetDate ? formatDate(targetDate) : "Target"}
          </span>
        ) : (
          <span className="text-[var(--color-text-secondary)]">Set dates</span>
        )}
      </PropertyRow>

      <PropertyRow label="Teams">
        {teams.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {teams.map((t) => (
              <span
                key={t.key}
                className="rounded-md bg-[var(--color-surface-active)] px-1.5 py-0.5 text-[12px]"
              >
                {t.name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[var(--color-text-secondary)]">Add team</span>
        )}
      </PropertyRow>

      <PropertyRow label="Labels">
        {labels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {labels.map((l) => (
              <LabelChip key={l.name} name={l.name} color={l.color} />
            ))}
          </div>
        ) : (
          <span className="text-[var(--color-text-secondary)]">Add label</span>
        )}
      </PropertyRow>
    </div>
  );
}
