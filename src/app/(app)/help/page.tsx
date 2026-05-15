"use client";

import { useAppShellContext } from "@/app/(app)/app-shell";

const sections = [
  {
    id: "help-center",
    title: "Help center / Docs",
    body: "Browse clone-local guidance for planning, issues, projects, views, teams, and account settings without leaving this workspace shell.",
  },
  {
    id: "contact-support",
    title: "Contact support",
    body: "For this clone, use your workspace administrator or project owner as the support contact. Production Linear support links are intentionally not opened from the app shell.",
  },
  {
    id: "system-status",
    title: "System status",
    body: "Status is modeled locally for the clone. Check the development environment, API health, and deployment logs for current availability.",
  },
  {
    id: "changelog",
    title: "Changelog / What's new",
    body: "Release notes for cloned features live with this repository and issue history. This page is the in-app landing point for what changed.",
  },
  {
    id: "download-apps",
    title: "Download apps",
    body: "Desktop and mobile app downloads are represented as clone-safe help content; no production Linear downloads are launched from here.",
  },
  {
    id: "community",
    title: "Community",
    body: "Community resources are represented inside the clone so users can discover support options without being silently sent to the production app.",
  },
];

export default function HelpPage() {
  const shellContext = useAppShellContext();

  return (
    <main className="h-full overflow-y-auto bg-[var(--color-content-bg)] p-8 text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-[12px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
            {shellContext?.workspaceName ?? "Workspace"} help
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Help and resources</h1>
          <p className="mt-3 text-[14px] leading-6 text-[var(--color-text-secondary)]">
            Clone-owned support, status, documentation, changelog, app download,
            and community resources. These destinations are intentionally local
            to the clone rather than production Linear links.
          </p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <h2 className="text-[16px] font-semibold">{section.title}</h2>
              <p className="mt-2 text-[13px] leading-6 text-[var(--color-text-secondary)]">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
