"use client";

import { useState } from "react";

interface CreateIssueModalProps {
  open: boolean;
  onClose: () => void;
  teamKey: string;
  teamName: string;
  teamId: string;
  defaultStateId: string;
}

export function CreateIssueModal({
  open,
  onClose,
  teamKey,
  teamName,
  teamId,
  defaultStateId,
}: CreateIssueModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("none");
  const [createMore, setCreateMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          teamId,
          stateId: defaultStateId,
          priority,
        }),
      });

      if (res.ok) {
        if (createMore) {
          setTitle("");
          setDescription("");
        } else {
          onClose();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[640px] rounded-xl border border-[var(--color-border)] bg-[var(--color-content-bg)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
          <span className="flex items-center gap-1.5 rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-[12px] font-medium text-[var(--color-text-primary)]">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-[var(--color-accent)] text-[7px] font-bold text-white">
              {teamKey.charAt(0)}
            </span>
            {teamKey}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[var(--color-text-secondary)]"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span className="text-[13px] text-[var(--color-text-primary)]">
            New issue
          </span>
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
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

        {/* Body */}
        <div className="px-4 py-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Issue title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent text-[18px] font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none"
          />

          {/* Description */}
          <textarea
            placeholder="Add description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-3 w-full resize-none bg-transparent text-[14px] text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none"
            rows={4}
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1 border-t border-[var(--color-border)] px-4 py-2">
          {/* Status */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2 py-1 text-[12px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="8"
                cy="8"
                r="5.5"
                stroke="var(--color-status-backlog)"
                strokeWidth="1.5"
                strokeDasharray="2.4 2"
                strokeLinecap="round"
              />
            </svg>
            Backlog
          </button>

          {/* Priority */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 5.5h10M3 8h10M3 10.5h10"
                stroke="var(--color-priority-none)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeOpacity="0.4"
              />
            </svg>
            Priority
          </button>

          {/* Labels */}
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2 py-1 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
              <path d="M7 7h.01" />
            </svg>
            Labels
          </button>

          <div className="flex-1" />

          {/* More actions */}
          <button
            type="button"
            aria-label="More actions"
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
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
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2.5">
          <label className="flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              checked={createMore}
              onChange={(e) => setCreateMore(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-[var(--color-border)] bg-transparent accent-[var(--color-accent)]"
            />
            Create more
          </label>

          <button
            type="button"
            disabled={!title.trim() || submitting}
            onClick={handleSubmit}
            className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
          >
            {submitting ? "Creating..." : "Create Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}
