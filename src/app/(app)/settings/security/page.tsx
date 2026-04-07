"use client";

import { useCallback, useState } from "react";

function Toggle({
  enabled,
  onChange,
  label,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full transition-colors ${
        enabled ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`inline-block h-[16px] w-[16px] rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function PermissionSelect({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <select
      value={value}
      onChange={(e) => setValue(e.target.value)}
      className="rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-[12px] text-[var(--color-text-secondary)] outline-none"
    >
      <option value="admins">Only admins</option>
      <option value="members">All members</option>
      <option value="anyone">Anyone</option>
    </select>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 mt-8 text-[14px] font-semibold text-[var(--color-text-primary)]">
      {children}
    </h2>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-[var(--color-text-primary)]">
          {title}
        </div>
        {description && (
          <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            {description}
          </div>
        )}
      </div>
      <div className="ml-4 shrink-0">{children}</div>
    </div>
  );
}

function generateInviteUrl(): string {
  const chars = "abcdef0123456789";
  let id = "";
  for (let i = 0; i < 32; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `https://linear.app/join/${id}`;
}

export default function SecurityPage() {
  const [inviteLinksEnabled, setInviteLinksEnabled] = useState(true);
  const [inviteUrl] = useState(() => generateInviteUrl());
  const [copied, setCopied] = useState(false);
  const [googleAuth, setGoogleAuth] = useState(true);
  const [emailPasskey, setEmailPasskey] = useState(true);
  const [restrictUploads, setRestrictUploads] = useState(false);
  const [improveAi, setImproveAi] = useState(true);
  const [webSearch, setWebSearch] = useState(true);
  const [hipaa, setHipaa] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(inviteUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [inviteUrl]);

  return (
    <div className="max-w-[720px]">
      <h1 className="mb-6 text-[20px] font-semibold text-[var(--color-text-primary)]">
        Security
      </h1>

      {/* ─── Workspace access ─────────────────────────────── */}
      <SectionHeader>Workspace access</SectionHeader>

      <div className="mb-6 rounded-lg border border-[var(--color-border)] p-4">
        <div className="mb-1 text-[13px] font-medium text-[var(--color-text-primary)]">
          Invite links
        </div>
        <p className="mb-4 text-[12px] text-[var(--color-text-tertiary)]">
          A uniquely generated invite link allows anyone with the link to join
          your workspace.
        </p>

        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] text-[var(--color-text-primary)]">
            Enable invite links
          </span>
          <Toggle
            enabled={inviteLinksEnabled}
            onChange={setInviteLinksEnabled}
            label="Enable invite links"
          />
        </div>

        {inviteLinksEnabled && (
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[12px] text-[var(--color-text-tertiary)]">
              {inviteUrl}
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </div>

      {/* ─── Workspace login and restrictions ─────────────── */}
      <div className="mb-6">
        <div className="mb-1 text-[13px] font-medium text-[var(--color-text-primary)]">
          Workspace login and restrictions
        </div>
        <p className="mb-3 text-[12px] text-[var(--color-text-tertiary)]">
          Anyone with an email address at these domains is allowed to sign up
          for this workspace.{" "}
          <button
            type="button"
            className="text-[var(--color-accent)] hover:underline"
          >
            Docs ↗
          </button>
        </p>
        <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-4 py-3">
          <span className="text-[13px] text-[var(--color-text-tertiary)]">
            No approved email domains
          </span>
          <button
            type="button"
            className="flex items-center gap-1.5 text-[12px] text-[var(--color-accent)] hover:underline"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add domain
          </button>
        </div>
      </div>

      {/* ─── Authentication methods ───────────────────────── */}
      <SectionHeader>Authentication methods</SectionHeader>

      <p className="mb-4 text-[12px] text-[var(--color-text-tertiary)]">
        Admins and guests can always authenticate via Google and
        email/passkeys—even when disabled for members.
      </p>

      <SettingRow
        title="Google authentication"
        description="When enabled, this is available to all workspace members and guests"
      >
        <Toggle
          enabled={googleAuth}
          onChange={setGoogleAuth}
          label="Google authentication"
        />
      </SettingRow>

      <SettingRow
        title="Email & passkey authentication"
        description="When enabled, this is available to all workspace members and guests"
      >
        <Toggle
          enabled={emailPasskey}
          onChange={setEmailPasskey}
          label="Email & passkey authentication"
        />
      </SettingRow>

      <div className="border-b border-[var(--color-border)] py-3">
        <button
          type="button"
          className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          SAML & SCIM →
        </button>
      </div>

      {/* ─── Workspace management ─────────────────────────── */}
      <SectionHeader>Workspace management</SectionHeader>

      <SettingRow title="New user invitations">
        <PermissionSelect defaultValue="members" />
      </SettingRow>
      <SettingRow title="Team creation">
        <PermissionSelect defaultValue="members" />
      </SettingRow>
      <SettingRow title="Manage workspace labels">
        <PermissionSelect defaultValue="members" />
      </SettingRow>
      <SettingRow title="Manage workspace templates">
        <PermissionSelect defaultValue="members" />
      </SettingRow>
      <SettingRow title="API key creation">
        <PermissionSelect defaultValue="admins" />
      </SettingRow>
      <SettingRow title="Modify agent guidance">
        <PermissionSelect defaultValue="admins" />
      </SettingRow>

      {/* ─── Restrict file uploads ────────────────────────── */}
      <div className="mt-6">
        <SettingRow
          title="Restrict file uploads"
          description="When enabled, only admins can upload files"
        >
          <Toggle
            enabled={restrictUploads}
            onChange={setRestrictUploads}
            label="Restrict file uploads"
          />
        </SettingRow>
      </div>

      {/* ─── AI ───────────────────────────────────────────── */}
      <SectionHeader>AI</SectionHeader>

      <SettingRow
        title="Improve AI"
        description="Allow Linear to use workspace data to improve AI features"
      >
        <Toggle
          enabled={improveAi}
          onChange={setImproveAi}
          label="Improve AI"
        />
      </SettingRow>
      <SettingRow
        title="Enable web search"
        description="Allow AI to search the web for additional context"
      >
        <Toggle
          enabled={webSearch}
          onChange={setWebSearch}
          label="Enable web search"
        />
      </SettingRow>

      {/* ─── Compliance ───────────────────────────────────── */}
      <SectionHeader>Compliance</SectionHeader>

      <SettingRow
        title="HIPAA compliance"
        description="Enable HIPAA-compliant mode for protected health information"
      >
        <Toggle enabled={hipaa} onChange={setHipaa} label="HIPAA compliance" />
      </SettingRow>
    </div>
  );
}
