"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings/account/preferences");
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
      Redirecting...
    </div>
  );
}
