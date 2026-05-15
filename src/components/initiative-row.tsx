"use client";

import { useAppShellContext } from "@/app/(app)/app-shell";
import { InitiativeStatusBadge } from "@/components/initiative-status-badge";
import { withWorkspaceSlug } from "@/lib/workspace-paths";
import Link from "next/link";

interface InitiativeData {
  id: string;
  name: string;
  description?: string | null;
  status: "active" | "planned" | "completed";
  projectCount: number;
  completedProjectCount: number;
}

interface InitiativeRowProps {
  initiative: InitiativeData;
}

export function InitiativeRow({ initiative }: InitiativeRowProps) {
  const workspaceSlug = useAppShellContext()?.workspaceSlug;
  const href = withWorkspaceSlug(
    `/initiatives/${initiative.id}`,
    workspaceSlug,
  );

  return (
    <Link
      href={href}
      data-testid="initiative-row"
      className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-hover)]"
    >
      {/* Icon */}
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--color-text-secondary)]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      </div>

      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-[var(--color-text-primary)]">
          {initiative.name}
        </span>
        {initiative.description && (
          <span className="block truncate text-[12px] text-[var(--color-text-tertiary)]">
            {initiative.description}
          </span>
        )}
      </div>

      {/* Status badge */}
      <InitiativeStatusBadge status={initiative.status} />

      {/* Project count + progress */}
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {initiative.completedProjectCount} / {initiative.projectCount}{" "}
          projects
        </span>
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
            style={{
              width: `${initiative.projectCount > 0 ? Math.round((initiative.completedProjectCount / initiative.projectCount) * 100) : 0}%`,
            }}
          />
        </div>
      </div>
    </Link>
  );
}
