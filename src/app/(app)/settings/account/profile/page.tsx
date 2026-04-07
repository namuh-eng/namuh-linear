"use client";

import { Avatar } from "@/components/avatar";
import { useEffect, useState } from "react";

interface ProfileData {
  name: string;
  email: string;
  username: string;
  image: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    username: "",
    image: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setProfile({
            name: data.user.name ?? "",
            email: data.user.email ?? "",
            username: data.user.username ?? "",
            image: data.user.image ?? null,
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          username: profile.username,
        }),
      });
    } finally {
      setSaving(false);
    }
  };

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
        Profile
      </h1>

      {/* Profile picture */}
      <div className="mb-6">
        <span className="mb-2 block text-[13px] text-[var(--color-text-secondary)]">
          Profile picture
        </span>
        <div className="flex items-center gap-4">
          <Avatar
            name={profile.name || "U"}
            src={profile.image ?? undefined}
            size="lg"
          />
          <div>
            <button
              type="button"
              className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              Upload photo
            </button>
            <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
              Recommended size: 256x256px
            </p>
          </div>
        </div>
      </div>

      {/* Email (read-only) */}
      <div className="mb-4">
        <label
          htmlFor="profile-email"
          className="mb-1.5 block text-[13px] text-[var(--color-text-secondary)]"
        >
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={profile.email}
          readOnly
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-1.5 text-[13px] text-[var(--color-text-tertiary)] outline-none"
          aria-label="Email"
        />
      </div>

      {/* Full name */}
      <div className="mb-4">
        <label
          htmlFor="profile-name"
          className="mb-1.5 block text-[13px] text-[var(--color-text-secondary)]"
        >
          Full name
        </label>
        <input
          id="profile-name"
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          aria-label="Full name"
        />
      </div>

      {/* Username */}
      <div className="mb-6">
        <label
          htmlFor="profile-username"
          className="mb-1.5 block text-[13px] text-[var(--color-text-secondary)]"
        >
          Username
        </label>
        <input
          id="profile-username"
          type="text"
          value={profile.username}
          onChange={(e) => setProfile({ ...profile, username: e.target.value })}
          className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-1.5 text-[13px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)]"
          placeholder="One word, like a nickname or first name"
          aria-label="Username"
        />
      </div>

      {/* Update button */}
      <button
        type="button"
        onClick={handleUpdate}
        disabled={saving}
        className="rounded-md bg-[var(--color-accent)] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Updating..." : "Update"}
      </button>

      {/* Workspace access */}
      <div className="mt-10 border-t border-[var(--color-border)] pt-6">
        <h3 className="mb-2 text-[13px] font-medium text-[var(--color-text-primary)]">
          Workspace access
        </h3>
        <button
          type="button"
          className="rounded-md border border-red-500/30 px-3 py-1.5 text-[12px] text-red-400 transition-colors hover:bg-red-500/10"
        >
          Leave workspace
        </button>
      </div>
    </div>
  );
}
