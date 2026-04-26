"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TeamAgentsSettingsPage() {
  const params = useParams();
  const teamKey = params.key as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [teamKey]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
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

      <h1 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
        Agents
      </h1>
      <p className="mt-2 text-[13px] text-[var(--color-text-tertiary)]">
        Manage AI agent guidance and team-specific automation behavior.
      </p>

      <div className="mt-8 space-y-6">
        <div className="rounded-lg border border-[var(--color-border)] p-4">
          <h3 className="mb-2 text-[14px] font-medium text-[var(--color-text-primary)]">
            Agent guidance
          </h3>
          <p className="mb-4 text-[13px] text-[var(--color-text-secondary)]">
            Custom instructions for AI agents when they are working on issues for this team.
          </p>
          <textarea
            className="h-32 w-full rounded-md border border-[var(--color-border)] bg-transparent p-3 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            placeholder="e.g. Always include a testing plan for frontend changes..."
          />
        </div>

        <div className="rounded-lg border border-[var(--color-border)] p-4">
          <h3 className="mb-2 text-[14px] font-medium text-[var(--color-text-primary)]">
            Auto-assignment
          </h3>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            AI agents can automatically assign issues to team members based on their expertise and current load.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[13px] text-[var(--color-text-primary)]">Enable auto-assignment</span>
            <button
              type="button"
              className="relative inline-flex h-[20px] w-[36px] items-center rounded-full bg-[var(--color-border)]"
            >
              <span className="inline-block h-[16px] w-[16px] translate-x-[2px] rounded-full bg-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
