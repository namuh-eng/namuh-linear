"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface SidebarProps {
  workspaceName?: string;
  workspaceInitials?: string;
  teamName?: string;
  teamKey?: string;
}

function SidebarLink({
  href,
  icon,
  label,
  badge,
  active,
  indent,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
  indent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-2 py-[5px] text-[13px] transition-colors ${
        indent ? "ml-4" : ""
      } ${
        active
          ? "bg-[#1f1f23] text-white"
          : "text-[#b0b5c0] hover:bg-[#1a1a1e] hover:text-white"
      }`}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="text-[11px] text-[#6b6f76]">{badge}</span>
      )}
    </Link>
  );
}

function SectionHeader({
  label,
  collapsible,
  collapsed,
  onToggle,
}: {
  label: string;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-4 mb-0.5 flex w-full items-center gap-1 px-2 text-[11px] font-medium uppercase tracking-wider text-[#6b6f76] hover:text-[#9ca3af]"
    >
      {collapsible && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`transition-transform ${collapsed ? "" : "rotate-90"}`}
          role="img"
          aria-label="Toggle section"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
      {label}
    </button>
  );
}

export function Sidebar({
  workspaceName = "Workspace",
  workspaceInitials = "W",
  teamName = "Engineering",
  teamKey = "ENG",
}: SidebarProps) {
  const pathname = usePathname();
  const [teamExpanded, setTeamExpanded] = useState(true);

  return (
    <aside className="flex h-screen w-[244px] shrink-0 flex-col bg-[#090909] px-3 py-2.5">
      {/* Workspace header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-md px-1 py-1">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#5E6AD2] text-[10px] font-bold text-white">
            {workspaceInitials}
          </div>
          <span className="max-w-[140px] truncate text-[13px] font-medium text-white">
            {workspaceName}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {/* Search button */}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#6b6f76] transition-colors hover:bg-[#1a1a1e] hover:text-white"
            aria-label="Search"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          {/* Create issue button */}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#6b6f76] transition-colors hover:bg-[#1a1a1e] hover:text-white"
            aria-label="Create issue"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {/* Personal */}
        <SidebarLink
          href="/inbox"
          label="Inbox"
          active={pathname === "/inbox"}
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Inbox icon"
            >
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          }
        />
        <SidebarLink
          href="/my-issues"
          label="My Issues"
          active={pathname.startsWith("/my-issues")}
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="My Issues icon"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          }
        />

        {/* Workspace */}
        <SectionHeader label="Workspace" />
        <SidebarLink
          href="/projects"
          label="Projects"
          active={pathname.startsWith("/projects")}
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Projects icon"
            >
              <path d="M2 17 12 22 22 17" />
              <path d="M2 12 12 17 22 12" />
              <path d="M12 2 2 7 12 12 22 7Z" />
            </svg>
          }
        />
        <SidebarLink
          href="/views"
          label="Views"
          active={pathname.startsWith("/views")}
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Views icon"
            >
              <path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z" />
              <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
            </svg>
          }
        />

        {/* Your teams */}
        <SectionHeader
          label="Your teams"
          collapsible
          collapsed={!teamExpanded}
          onToggle={() => setTeamExpanded(!teamExpanded)}
        />
        {teamExpanded && (
          <>
            <div className="flex items-center gap-2 rounded-md px-2 py-[5px] text-[13px] font-medium text-white">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#5E6AD2] text-[8px] font-bold text-white">
                {teamKey.charAt(0)}
              </span>
              <span className="truncate">{teamName}</span>
            </div>
            <SidebarLink
              href={`/team/${teamKey}/triage`}
              label="Triage"
              active={pathname === `/team/${teamKey}/triage`}
              indent
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Triage icon"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              }
            />
            <SidebarLink
              href={`/team/${teamKey}/all`}
              label="Issues"
              active={
                pathname === `/team/${teamKey}/all` ||
                pathname === `/team/${teamKey}/board`
              }
              indent
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Issues icon"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
            />
            <SidebarLink
              href={`/team/${teamKey}/projects`}
              label="Projects"
              active={pathname === `/team/${teamKey}/projects`}
              indent
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Team Projects icon"
                >
                  <path d="M2 17 12 22 22 17" />
                  <path d="M2 12 12 17 22 12" />
                  <path d="M12 2 2 7 12 12 22 7Z" />
                </svg>
              }
            />
            <SidebarLink
              href={`/team/${teamKey}/views`}
              label="Views"
              active={pathname === `/team/${teamKey}/views`}
              indent
              icon={
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  role="img"
                  aria-label="Team Views icon"
                >
                  <path d="M5 12s2.545-5 7-5c4.454 0 7 5 7 5s-2.546 5-7 5c-4.455 0-7-5-7-5z" />
                  <path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
                </svg>
              }
            />
          </>
        )}

        {/* Try section */}
        <SectionHeader label="Try" />
        <SidebarLink
          href="/initiatives"
          label="Initiatives"
          active={pathname.startsWith("/initiatives")}
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Initiatives icon"
            >
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
              <path d="M4 22h16" />
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
            </svg>
          }
        />
        <SidebarLink
          href={`/team/${teamKey}/cycles`}
          label="Cycles"
          active={pathname.includes("/cycles")}
          icon={
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label="Cycles icon"
            >
              <path d="M21.5 2v6h-6" />
              <path d="M2.5 22v-6h6" />
              <path d="M22 11.5A10 10 0 0 0 3.2 7.2" />
              <path d="M2 12.5a10 10 0 0 0 18.8 4.3" />
            </svg>
          }
        />
      </nav>

      {/* Bottom help */}
      <div className="mt-auto pt-2">
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#6b6f76] transition-colors hover:bg-[#1a1a1e] hover:text-white"
          aria-label="Help"
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <path d="M12 17h.01" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
