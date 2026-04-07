"use client";

import { IssueRow, priorityMap } from "@/components/issue-row";
import { IssuesGroupHeader } from "@/components/issues-group-header";
import { MilestoneRow } from "@/components/milestone-row";
import { ProjectProperties } from "@/components/project-properties";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type StatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled";

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  slug: string;
  status: "planned" | "started" | "paused" | "completed" | "canceled";
  priority: string;
  startDate: string | null;
  targetDate: string | null;
}

interface MilestoneData {
  id: string;
  name: string;
  issueCount: number;
  completedCount: number;
  progress: number;
}

interface IssueData {
  id: string;
  number: number;
  identifier: string;
  title: string;
  priority: string;
  assignee: { name: string; image?: string | null } | null;
  createdAt: string;
}

interface StateGroup {
  state: { id: string; name: string; category: string; color: string };
  issues: IssueData[];
}

interface ProjectResponse {
  project: ProjectDetail;
  lead: { name: string; image?: string | null } | null;
  members: { name: string; image?: string | null }[];
  teams: { name: string; key: string }[];
  milestones: MilestoneData[];
  issueGroups: StateGroup[];
  progress: { total: number; completed: number; percentage: number };
}

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "issues"
  >("overview");

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/projects/${params.slug}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Project not found
      </div>
    );
  }

  const { project: proj } = data;
  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "activity" as const, label: "Activity" },
    { id: "issues" as const, label: "Issues" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-6 py-2">
        <span className="text-[20px]">{proj.icon ?? "📋"}</span>
        <h1 className="text-[15px] font-medium text-[var(--color-text-primary)]">
          {proj.name}
        </h1>
        <div className="flex-1" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-[var(--color-border)] px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`border-b-2 px-3 py-2 text-[13px] transition-colors ${
              activeTab === tab.id
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="flex gap-8 p-6">
            {/* Main content */}
            <div className="min-w-0 flex-1">
              {/* Icon + Title */}
              <div className="mb-4 flex items-center gap-3">
                <span className="text-[40px]">{proj.icon ?? "📋"}</span>
                <h2 className="text-[24px] font-semibold text-[var(--color-text-primary)]">
                  {proj.name}
                </h2>
              </div>

              {/* Description */}
              {proj.description && (
                <p className="mb-6 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                  {proj.description}
                </p>
              )}

              {/* Resources */}
              <div className="mb-6">
                <h3 className="mb-2 text-[13px] font-medium text-[var(--color-text-primary)]">
                  Resources
                </h3>
                <button
                  type="button"
                  className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  + Add document or link...
                </button>
              </div>

              {/* Write first project update */}
              <div className="mb-8 rounded-lg border border-[var(--color-border)] p-4">
                <div className="flex items-center gap-2">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-500"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-[13px] text-[var(--color-text-primary)]">
                    Write first project update
                  </span>
                </div>
              </div>

              {/* Milestones */}
              {data.milestones.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-2 text-[13px] font-medium text-[var(--color-text-primary)]">
                    Milestones
                  </h3>
                  <div className="space-y-0.5">
                    {data.milestones.map((m) => (
                      <MilestoneRow
                        key={m.id}
                        name={m.name}
                        progress={m.progress}
                        issueCount={m.issueCount}
                        completedCount={m.completedCount}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Progress */}
              <div>
                <h3 className="mb-2 text-[13px] font-medium text-[var(--color-text-primary)]">
                  Progress
                </h3>
                <div className="text-[13px] text-[var(--color-text-secondary)]">
                  {data.progress.completed} of {data.progress.total} issues
                  completed ({data.progress.percentage}%)
                </div>
              </div>
            </div>

            {/* Properties sidebar */}
            <div className="w-[280px] shrink-0">
              <ProjectProperties
                status={proj.status}
                priority={proj.priority}
                lead={
                  data.lead
                    ? {
                        name: data.lead.name,
                        image: data.lead.image ?? undefined,
                      }
                    : null
                }
                members={data.members.map((m) => ({
                  name: m.name,
                  image: m.image ?? undefined,
                }))}
                startDate={proj.startDate}
                targetDate={proj.targetDate}
                teams={data.teams}
                labels={[]}
              />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="p-6">
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              No activity yet. Updates and changes will appear here.
            </p>
          </div>
        )}

        {activeTab === "issues" && (
          <div>
            {data.issueGroups.length === 0 ? (
              <div className="p-6 text-[13px] text-[var(--color-text-secondary)]">
                No issues in this project.
              </div>
            ) : (
              data.issueGroups.map((group) => (
                <div key={group.state.id}>
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
                      createdAt={iss.createdAt}
                    />
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
