"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface TeamLabel {
  id: string;
  name: string;
  color: string;
}

export default function TeamLabelsSettingsPage() {
  const params = useParams();
  const teamKey = params.key as string;
  const [team, setTeam] = useState<{ name: string } | null>(null);
  const [labels, setLabels] = useState<TeamLabel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/teams/${teamKey}/settings`).then((res) => res.json()),
      fetch(`/api/teams/${teamKey}/labels`).then((res) => res.json()),
    ])
      .then(([teamData, labelData]) => {
        setTeam(teamData.team);
        setLabels(labelData.labels);
      })
      .finally(() => setLoading(false));
  }, [teamKey]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Team not found
      </div>
    );
  }

  return (
    <div className="max-w-[720px]">
      <div className="mb-6">
        <Link
          href={`/settings/teams/${encodeURIComponent(teamKey)}`}
          className="text-[12px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          Back to team settings
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
          Issue labels
        </h1>
        <button
          type="button"
          className="rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
        >
          Create label
        </button>
      </div>
      <p className="mt-2 text-[13px] text-[var(--color-text-tertiary)]">
        Manage labels available for ${team.name} issues.
      </p>

      <div className="mt-8 flex flex-col gap-1">
        {labels.map((label) => (
          <div
            key={label.id}
            className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <span className="text-[13px] text-[var(--color-text-primary)]">
                {label.name}
              </span>
            </div>
            <button
              type="button"
              className="text-[12px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
