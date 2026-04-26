"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";

export default function AccountSecurityPage() {
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
        Account security
      </h1>
      <p className="mt-3 text-[14px] text-[var(--color-text-secondary)]">
        Manage your password, two-factor authentication, and active sessions.
      </p>

      <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="text-[15px] font-medium text-[var(--color-text-primary)]">
          Two-factor authentication
        </h2>
        <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
          Add an extra layer of security to your account by requiring more than just a password to log in.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
        >
          Enable 2FA
        </button>
      </div>
    </div>
  );
}
