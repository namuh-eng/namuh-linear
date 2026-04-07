"use client";

import { useState } from "react";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        checked ? "bg-[var(--color-accent)]" : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

function ChannelCard({
  name,
  description,
  enabled,
}: {
  name: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4 transition-colors hover:bg-[var(--color-surface-hover)]">
      <div>
        <div className="text-[13px] font-medium text-[var(--color-text-primary)]">
          {name}
        </div>
        <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
          {description}
        </div>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] ${
          enabled
            ? "bg-green-500/10 text-green-400"
            : "bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
        }`}
      >
        {enabled ? "Enabled" : "Disabled"}
      </span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="mt-8 mb-3 border-b border-[var(--color-border)] pb-2 text-[13px] font-medium text-[var(--color-text-primary)]">
      {title}
    </h3>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-[13px] text-[var(--color-text-primary)]">
          {label}
        </div>
        {description && (
          <div className="mt-0.5 text-[12px] text-[var(--color-text-tertiary)]">
            {description}
          </div>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function NotificationsSettingsPage() {
  const [changelogSidebar, setChangelogSidebar] = useState(true);
  const [changelogNewsletter, setChangelogNewsletter] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [inviteAccepted, setInviteAccepted] = useState(true);
  const [privacyUpdates, setPrivacyUpdates] = useState(true);
  const [dpa, setDpa] = useState(false);

  return (
    <div className="max-w-[600px]">
      <h1 className="mb-6 text-[20px] font-semibold text-[var(--color-text-primary)]">
        Notifications
      </h1>

      {/* Notification channels */}
      <div className="mb-2 text-[13px] text-[var(--color-text-secondary)]">
        Notification channels
      </div>
      <div className="grid gap-3">
        <ChannelCard
          name="Desktop"
          description="Enabled for assignments, status changes, and 10 others"
          enabled
        />
        <ChannelCard
          name="Mobile"
          description="Enabled for all notifications"
          enabled
        />
        <ChannelCard
          name="Email"
          description="Not configured"
          enabled={false}
        />
        <ChannelCard
          name="Slack"
          description="Not configured"
          enabled={false}
        />
      </div>

      {/* Updates from Linear */}
      <SectionHeader title="Updates from Linear" />

      <div className="mb-1 text-[12px] text-[var(--color-text-tertiary)]">
        Changelog
      </div>
      <ToggleRow
        label="Show in sidebar"
        checked={changelogSidebar}
        onChange={setChangelogSidebar}
      />
      <ToggleRow
        label="Newsletter"
        description="Receive changelog updates via email"
        checked={changelogNewsletter}
        onChange={setChangelogNewsletter}
      />
      <ToggleRow
        label="Marketing"
        description="Occasional product announcements and tips"
        checked={marketing}
        onChange={setMarketing}
      />

      {/* Other */}
      <SectionHeader title="Other" />

      <ToggleRow
        label="Invite accepted"
        description="Notify when someone accepts your invite"
        checked={inviteAccepted}
        onChange={setInviteAccepted}
      />
      <ToggleRow
        label="Privacy and legal updates"
        description="Important privacy and legal notifications"
        checked={privacyUpdates}
        onChange={setPrivacyUpdates}
      />
      <ToggleRow
        label="DPA"
        description="Data Processing Agreement notifications"
        checked={dpa}
        onChange={setDpa}
      />
    </div>
  );
}
