"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface LabelData {
  id: string;
  name: string;
  color: string;
  description: string | null;
  parentLabelId: string | null;
  issueCount: number;
  lastApplied: string | null;
  createdAt: string;
}

const LABEL_COLORS = [
  "#e5484d",
  "#e54666",
  "#f76b15",
  "#f5a623",
  "#f2c94c",
  "#4cb782",
  "#3b82f6",
  "#7180ff",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#6b6f76",
];

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatCreatedDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function ColorDot({ color }: { color: string }) {
  return (
    <span
      data-testid="color-dot"
      className="inline-block h-3 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}

function InlineDescription({
  value,
  labelId,
  onSave,
}: {
  value: string | null;
  labelId: string;
  onSave: (id: string, desc: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const handleSave = () => {
    setEditing(false);
    if (text !== (value || "")) {
      onSave(labelId, text);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") {
            setText(value || "");
            setEditing(false);
          }
        }}
        className="w-full rounded border border-[var(--color-border)] bg-transparent px-1 py-0.5 text-[12px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
        placeholder="Add label description..."
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full truncate text-left text-[12px]"
    >
      {value ? (
        <span className="text-[var(--color-text-tertiary)]">{value}</span>
      ) : (
        <span className="italic text-[var(--color-text-tertiary)] opacity-50">
          Add label description...
        </span>
      )}
    </button>
  );
}

function CreateLabelModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), color);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[400px] rounded-lg border border-[var(--color-border)] bg-[var(--color-content-bg)] p-6 shadow-xl">
        <h2 className="mb-4 text-[16px] font-semibold text-[var(--color-text-primary)]">
          Create label
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="label-name"
              className="mb-1 block text-[12px] text-[var(--color-text-secondary)]"
            >
              Name
            </label>
            <input
              ref={nameRef}
              id="label-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
              placeholder="Label name"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="label-color"
              className="mb-2 block text-[12px] text-[var(--color-text-secondary)]"
            >
              Color
            </label>
            <div className="flex flex-wrap gap-2" id="label-color">
              {LABEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-all ${
                    color === c
                      ? "border-white scale-110"
                      : "border-transparent hover:border-[var(--color-border)]"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              Create label
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function IssueLabelsPage() {
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchLabels = useCallback(() => {
    fetch("/api/labels")
      .then((res) => res.json())
      .then((data) => {
        setLabels(data.labels ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const handleUpdateDescription = async (id: string, description: string) => {
    await fetch(`/api/labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    setLabels((prev) =>
      prev.map((l) => (l.id === id ? { ...l, description } : l)),
    );
  };

  const handleCreate = async (name: string, color: string) => {
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      setShowCreateModal(false);
      fetchLabels();
    }
  };

  const filteredLabels = labels.filter((l) =>
    l.name.toLowerCase().includes(filter.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
          Issue labels
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            New group
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:opacity-90"
          >
            New label
          </button>
        </div>
      </div>

      {/* Filter and scope */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name..."
            className="w-full rounded-md border border-[var(--color-border)] bg-transparent py-1.5 pr-3 pl-9 text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)]"
          />
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          Workspace
          <svg
            className="h-3 w-3"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Table header */}
      <div className="flex h-[32px] items-center border-b border-[var(--color-border)] text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
        <div className="min-w-0 flex-1 px-4">
          <span className="cursor-pointer hover:text-[var(--color-text-primary)]">
            Name
          </span>
        </div>
        <div className="w-[200px] shrink-0 px-2">Description</div>
        <div className="w-[60px] shrink-0 px-2 text-center">Rules</div>
        <div className="w-[60px] shrink-0 px-2 text-center">Issues</div>
        <div className="w-[100px] shrink-0 px-2">Last applied</div>
        <div className="w-[90px] shrink-0 px-2">Created</div>
      </div>

      {/* Label rows */}
      {filteredLabels.length === 0 ? (
        <div className="py-12 text-center text-[13px] text-[var(--color-text-tertiary)]">
          {labels.length === 0
            ? "No labels yet. Create labels to categorize issues."
            : "No labels matching your filter."}
        </div>
      ) : (
        <div>
          {filteredLabels.map((labelItem) => (
            <div
              key={labelItem.id}
              className="group flex h-[44px] items-center border-b border-[var(--color-border)] text-[13px] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
                <ColorDot color={labelItem.color} />
                <span className="truncate text-[var(--color-text-primary)]">
                  {labelItem.name}
                </span>
              </div>
              <div className="w-[200px] shrink-0 px-2">
                <InlineDescription
                  value={labelItem.description}
                  labelId={labelItem.id}
                  onSave={handleUpdateDescription}
                />
              </div>
              <div className="w-[60px] shrink-0 px-2 text-center text-[12px] text-[var(--color-text-tertiary)]">
                —
              </div>
              <div className="w-[60px] shrink-0 px-2 text-center text-[12px] text-[var(--color-text-secondary)]">
                {labelItem.issueCount}
              </div>
              <div className="w-[100px] shrink-0 px-2 text-[12px] text-[var(--color-text-tertiary)]">
                {formatRelativeTime(labelItem.lastApplied)}
              </div>
              <div className="w-[90px] shrink-0 px-2 text-[12px] text-[var(--color-text-tertiary)]">
                {formatCreatedDate(labelItem.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create label modal */}
      {showCreateModal && (
        <CreateLabelModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
