"use client";

import { EmptyState } from "@/components/empty-state";
import { TriageHeader } from "@/components/triage-header";
import { TriageRow } from "@/components/triage-row";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface TriageIssue {
  id: string;
  identifier: string;
  title: string;
  priority: string;
  creatorName: string;
  creatorImage: string | null;
  createdAt: string;
  labels: { name: string; color: string }[];
}

interface TriageResponse {
  team: { id: string; name: string; key: string };
  issues: TriageIssue[];
  count: number;
}

export default function TeamTriagePage() {
  const params = useParams<{ key: string }>();
  const [data, setData] = useState<TriageResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTriage = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${params.key}/triage`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, [params.key]);

  useEffect(() => {
    fetchTriage();
  }, [fetchTriage]);

  const handleAccept = useCallback(
    async (issueId: string) => {
      const res = await fetch(`/api/teams/${params.key}/triage/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (res.ok) {
        fetchTriage();
      }
    },
    [params.key, fetchTriage],
  );

  const handleDecline = useCallback(
    async (issueId: string) => {
      const res = await fetch(`/api/teams/${params.key}/triage/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (res.ok) {
        fetchTriage();
      }
    },
    [params.key, fetchTriage],
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!data || data.issues.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <TriageHeader teamName={data?.team.name ?? ""} count={0} />
        <EmptyState
          title="No issues to triage"
          description="When new issues are created, they'll appear here for review. Accept them into your workflow or decline."
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b6f76"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Triage"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
          action={{
            label: "Create triage issue",
            onClick: () => {},
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <TriageHeader teamName={data.team.name} count={data.count} />

      <div className="flex-1 overflow-y-auto">
        {data.issues.map((issue) => (
          <TriageRow
            key={issue.id}
            issue={issue}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        ))}
      </div>

      <div className="flex items-center border-t border-[var(--color-border)] px-4 py-1.5 text-[12px] text-[var(--color-text-secondary)]">
        {data.count} issues
      </div>
    </div>
  );
}
