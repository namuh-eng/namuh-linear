"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";

export default function AISettingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="p-8 text-[var(--color-text-tertiary)]">Loading...</div>;
  }

  return (
    <div className="max-w-[720px]">
      <h1 className="text-[28px] font-semibold text-[var(--color-text-primary)]">
        AI & Agents
      </h1>
      <p className="mt-3 text-[14px] text-[var(--color-text-secondary)]">
        Configure workspace-wide AI features and agent assistance behaviors.
      </p>

      <div className="mt-8">
        <EmptyState
          title="AI features are enabled"
          description="Your workspace is currently using the default AI agent configurations."
        />
      </div>
    </div>
  );
}
