"use client";

import { EmptyState } from "@/components/empty-state";
import { IssueRow, priorityMap } from "@/components/issue-row";
import { IssuesGroupHeader } from "@/components/issues-group-header";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface IssueData {
  id: string;
  number: number;
  identifier: string;
  title: string;
  priority: string;
  assignee: { name: string; image?: string } | null;
  labels: { name: string; color: string }[];
  dueDate: string | null;
  createdAt: string;
}

interface StateGroup {
  state: {
    id: string;
    name: string;
    category: string;
    color: string;
    position: number;
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

export default function TeamIssuesPage() {
  const params = useParams<{ key: string }>();
  const [data, setData] = useState<IssuesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

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
        description="Create your first issue to start tracking work for your team."
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
            aria-label="Issues"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        }
        action={{ label: "Create issue" }}
      />
    );
  }

  // Filter groups based on active tab
  const filteredGroups = data.groups.filter((g) => {
    if (activeTab === "all") return true;
    if (activeTab === "active")
      return g.state.category === "started" || g.state.category === "unstarted";
    if (activeTab === "backlog") return g.state.category === "backlog";
    return true;
  });

  const tabs = [
    { id: "all", label: "All issues" },
    { id: "active", label: "Active" },
    { id: "backlog", label: "Backlog" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-4 py-2">
        <h1 className="mr-4 text-[15px] font-medium text-[var(--color-text-primary)]">
          {data.team.name}
        </h1>
        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-2.5 py-1 text-[13px] transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {totalIssues} issues
        </span>
      </div>

      {/* Issues list */}
      <div className="flex-1 overflow-y-auto">
        {filteredGroups.map((group) => (
          <div key={group.state.id} className="group">
            <IssuesGroupHeader
              name={group.state.name}
              count={group.issues.length}
              statusCategory={group.state.category as StatusCategory}
              statusColor={group.state.color}
            />
            {group.issues.map((iss) => (
              <IssueRow
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
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center border-t border-[var(--color-border)] px-4 py-1.5 text-[12px] text-[var(--color-text-secondary)]">
        {totalIssues} issues
      </div>
    </div>
  );
}
