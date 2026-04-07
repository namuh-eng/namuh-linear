"use client";

export interface MilestoneRowProps {
  name: string;
  progress: number;
  issueCount: number;
  completedCount: number;
}

export function MilestoneRow({
  name,
  progress,
  issueCount,
  completedCount,
}: MilestoneRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-[var(--color-surface-hover)]">
      {/* Status dot */}
      <span
        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
          progress === 100
            ? "bg-green-500"
            : progress > 0
              ? "bg-yellow-500"
              : "bg-[var(--color-text-secondary)]"
        }`}
      />

      {/* Name */}
      <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--color-text-primary)]">
        {name}
      </span>

      {/* Progress */}
      <span className="shrink-0 text-[12px] text-[var(--color-text-secondary)]">
        {progress}%
      </span>

      {/* Issue count */}
      <span className="shrink-0 text-[12px] text-[var(--color-text-secondary)]">
        of {issueCount}
      </span>

      {/* Progress bar */}
      <div
        data-testid="milestone-progress-bar"
        className="h-1.5 w-[60px] shrink-0 overflow-hidden rounded-full bg-[var(--color-border)]"
      >
        <div
          className={`h-full rounded-full transition-all ${
            progress === 100
              ? "bg-green-500"
              : progress > 0
                ? "bg-[var(--color-accent)]"
                : ""
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
