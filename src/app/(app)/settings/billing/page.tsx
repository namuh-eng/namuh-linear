"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";

export default function BillingSettingsPage() {
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
        Billing
      </h1>
      <p className="mt-3 text-[14px] text-[var(--color-text-secondary)]">
        Manage your plan, payment methods, and invoices.
      </p>

      <div className="mt-8">
        <EmptyState
          title="Free Plan"
          description="You are currently on the free plan. Upgrade for more features."
          action={{
            label: "View plans",
            onClick: () => console.log("View plans"),
          }}
        />
      </div>
    </div>
  );
}
