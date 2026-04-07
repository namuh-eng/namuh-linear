"use client";

import { BoardColumn } from "@/components/board-column";
import { EmptyState } from "@/components/empty-state";
import { IssueCard } from "@/components/issue-card";
import { priorityMap } from "@/components/issue-row";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface IssueData {
  id: string;
  identifier: string;
  title: string;
  priority: string;
  assignee: { name: string; image?: string } | null;
  labels: { name: string; color: string }[];
  createdAt: string;
}

interface StateGroup {
  state: {
    id: string;
    name: string;
    category: string;
    color: string;
  };
  issues: IssueData[];
}

interface IssuesResponse {
  team: { id: string; name: string; key: string };
  groups: StateGroup[];
}

type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

export default function TeamBoardPage() {
  const params = useParams<{ key: string }>();
  const [data, setData] = useState<IssuesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIssues() {
      try {
        const res = await fetch(`/api/teams/${params.key}/issues`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchIssues();
  }, [params.key]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  const totalIssues =
    data?.groups.reduce((sum, g) => sum + g.issues.length, 0) ?? 0;

  if (!data || totalIssues === 0) {
    return (
      <EmptyState
        title="No issues"
        description="Create issues to see them on the board, organized by status."
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
            aria-label="Board"
          >
            <rect width="6" height="14" x="4" y="5" rx="1" />
            <rect width="6" height="10" x="14" y="7" rx="1" />
          </svg>
        }
        action={{ label: "Create issue" }}
      />
    );
  }

  // Filter out empty columns for completed/canceled by default
  const visibleGroups = data.groups.filter(
    (g) =>
      g.issues.length > 0 ||
      (g.state.category !== "completed" && g.state.category !== "canceled"),
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center border-b border-[var(--color-border)] px-4 py-2">
        <h1 className="text-[15px] font-medium text-[var(--color-text-primary)]">
          {data.team.name}
        </h1>
        <div className="flex-1" />
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {totalIssues} issues
        </span>
      </div>

      {/* Board */}
      <div className="flex flex-1 gap-0 overflow-x-auto p-2">
        {visibleGroups.map((group) => (
          <BoardColumn
            key={group.state.id}
            name={group.state.name}
            count={group.issues.length}
            statusCategory={group.state.category as StatusCategory}
            statusColor={group.state.color}
          >
            {group.issues.map((iss) => (
              <IssueCard
                key={iss.id}
                identifier={iss.identifier}
                title={iss.title}
                priority={priorityMap[iss.priority] ?? 0}
                statusCategory={group.state.category as StatusCategory}
                statusColor={group.state.color}
                assigneeName={iss.assignee?.name}
                assigneeImage={iss.assignee?.image ?? undefined}
                labels={iss.labels}
                createdAt={iss.createdAt}
              />
            ))}
          </BoardColumn>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-[var(--color-border)] px-4 py-1.5 text-[12px] text-[var(--color-text-secondary)]">
        {totalIssues} issues
      </div>
    </div>
  );
}
