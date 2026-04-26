"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface CycleMetric {
  id: string;
  name: string;
  total: number;
  completed: number;
  percentage: number;
}

interface AnalyticsData {
  team: { id: string; name: string };
  cycleMetrics: CycleMetric[];
  velocity: number;
  period: string;
}

export default function TeamAnalyticsPage() {
  const params = useParams();
  const teamKey = params.key as string;
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/teams/${teamKey}/analytics`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, [teamKey]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading analytics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Team not found
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[800px] mx-auto">
      <h1 className="text-[24px] font-semibold text-[var(--color-text-primary)] mb-8">
        {data.team.name} Analytics
      </h1>

      <div className="grid gap-6">
        {/* Velocity Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-content-bg)] p-6">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">
            Velocity ({data.period})
          </h2>
          <div className="text-[36px] font-bold text-[var(--color-text-primary)]">
            {data.velocity}
          </div>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-1">
            Average issues completed per week
          </p>
        </div>

        {/* Cycle Metrics */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-content-bg)] p-6">
          <h2 className="text-[13px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)] mb-6">
            Recent Cycles
          </h2>
          <div className="space-y-6">
            {data.cycleMetrics.map((metric) => (
              <div key={metric.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] font-medium text-[var(--color-text-primary)]">
                    {metric.name}
                  </span>
                  <span className="text-[13px] text-[var(--color-text-secondary)]">
                    {metric.completed} / {metric.total} ({metric.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-accent)] transition-all"
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {data.cycleMetrics.length === 0 && (
              <p className="text-[13px] text-[var(--color-text-secondary)] text-center py-4">
                No cycle data available for this team.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
