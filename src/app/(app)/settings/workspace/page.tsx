"use client";

import { Avatar } from "@/components/avatar";
import { useEffect, useState } from "react";

interface WorkspaceData {
  name: string;
  urlSlug: string;
  logo: string | null;
  region: string;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mt-8 mb-3 border-b border-[var(--color-border)] pb-2 text-[13px] font-medium text-[var(--color-text-primary)]">
      {title}
    </h3>
  );
}

export default function WorkspaceSettingsPage() {
  const [workspace, setWorkspace] = useState<WorkspaceData>({
    name: "",
    urlSlug: "",
    logo: null,
    region: "United States",
  });
  const [loading, setLoading] = useState(true);
  const [fiscalMonth, setFiscalMonth] = useState("january");

  useEffect(() => {
    fetch("/api/workspaces/current")
      .then((res) => res.json())
      .then((data) => {
        if (data?.workspace) {
          setWorkspace({
            name: data.workspace.name ?? "",
            urlSlug: data.workspace.urlSlug ?? "",
            logo: data.workspace.logo ?? null,
            region: data.workspace.region ?? "United States",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[var(--color-text-secondary)]">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-[600px]">
      <h1 className="mb-6 text-[20px] font-semibold text-[var(--color-text-primary)]">
        Workspace
      </h1>

      {/* Logo */}
      <div className="mb-6">
        <span className="mb-2 block text-[13px] text-[var(--color-text-secondary)]">
          Logo
        </span>
        <div className="flex items-center gap-4">
          <Avatar
            name={workspace.name || "W"}
            src={workspace.logo ?? undefined}
            size="lg"
          />
          <div>
            <button
              type="button"
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              Upload logo
            </button>
            <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
              Recommended size: 256x256px
            </p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="mb-4">
        <label
          htmlFor="ws-name"
          className="mb-1.5 block text-[13px] text-[var(--color-text-secondary)]"
        >
          Name
        </label>
        <input
          id="ws-name"
          type="text"
          value={workspace.name}
          onChange={(e) => setWorkspace({ ...workspace, name: e.target.value })}
          className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          aria-label="Workspace name"
        />
      </div>

      {/* URL */}
      <div className="mb-4">
        <label
          htmlFor="ws-url"
          className="mb-1.5 block text-[13px] text-[var(--color-text-secondary)]"
        >
          URL
        </label>
        <div className="flex items-center gap-0">
          <span className="rounded-l-md border border-r-0 border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-1.5 text-[13px] text-[var(--color-text-tertiary)]">
            linear.app/
          </span>
          <input
            id="ws-url"
            type="text"
            value={workspace.urlSlug}
            onChange={(e) =>
              setWorkspace({ ...workspace, urlSlug: e.target.value })
            }
            className="w-full rounded-r-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
            aria-label="Workspace URL slug"
          />
        </div>
      </div>

      {/* Time & region */}
      <SectionHeader title="Time & region" />

      <div className="mb-4 flex items-center justify-between py-2">
        <span className="text-[13px] text-[var(--color-text-primary)]">
          First month of fiscal year
        </span>
        <select
          value={fiscalMonth}
          onChange={(e) => setFiscalMonth(e.target.value)}
          className="rounded-md border border-[var(--color-border)] bg-transparent px-2.5 py-1 text-[12px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          aria-label="First month of fiscal year"
        >
          <option value="january">January</option>
          <option value="february">February</option>
          <option value="march">March</option>
          <option value="april">April</option>
          <option value="july">July</option>
          <option value="october">October</option>
        </select>
      </div>

      <div className="flex items-center justify-between py-2">
        <span className="text-[13px] text-[var(--color-text-primary)]">
          Region
        </span>
        <span className="text-[12px] text-[var(--color-text-tertiary)]">
          {workspace.region}
        </span>
      </div>

      {/* Welcome message */}
      <SectionHeader title="Welcome message" />
      <div className="py-2">
        <button
          type="button"
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          Configure
        </button>
      </div>

      {/* Danger zone */}
      <SectionHeader title="Danger zone" />
      <div className="py-2">
        <p className="mb-3 text-[12px] text-[var(--color-text-tertiary)]">
          Deleting a workspace will permanently remove all its data. This action
          cannot be undone.
        </p>
        <button
          type="button"
          className="rounded-md border border-red-500/30 px-3 py-1.5 text-[12px] text-red-400 transition-colors hover:bg-red-500/10"
        >
          Delete workspace
        </button>
      </div>
    </div>
  );
}
