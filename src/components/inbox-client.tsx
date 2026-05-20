"use client";

import { useAppShellContext } from "@/app/(app)/app-shell";
import { EmptyState } from "@/components/empty-state";
import { NotificationRow } from "@/components/notification-row";
import { withWorkspaceSlug } from "@/lib/workspace-paths";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const PRIORITY_SORT_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
  none: 4,
};

const DEFAULT_PREFERENCES = {
  showReadItems: true,
  showUnreadItemsFirst: false,
  showSnoozedItems: false,
};

interface InboxDisplayPreferences {
  showReadItems: boolean;
  showUnreadItemsFirst: boolean;
  showSnoozedItems: boolean;
}

interface Notification {
  id: string;
  type: "assigned" | "mentioned" | "status_change" | "comment" | "duplicate";
  actorName: string;
  actorImage: string | null;
  issueIdentifier: string | null;
  issueTitle: string;
  issuePriority: "urgent" | "high" | "medium" | "low" | "none";
  issueId: string | null;
  readAt: string | null;
  snoozedUntilAt: string | null;
  unsnoozedAt: string | null;
  createdAt: string;
}

interface InboxClientProps {
  initialSelectedId?: string | null;
}

function emitNotificationChange(unreadCount: number) {
  window.dispatchEvent(
    new CustomEvent("notifications:changed", {
      detail: { unreadCount },
    }),
  );
}

function isSnoozed(notification: Notification) {
  if (!notification.snoozedUntilAt) {
    return false;
  }

  return new Date(notification.snoozedUntilAt).getTime() > Date.now();
}

function formatSnoozedUntil(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getUnreadCount(notifications: Notification[]) {
  return notifications.filter((notification) => notification.readAt === null)
    .length;
}

export function InboxClient({ initialSelectedId = null }: InboxClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialSelectedId,
  );
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"latest" | "priority">("latest");
  const [preferences, setPreferences] =
    useState<InboxDisplayPreferences>(DEFAULT_PREFERENCES);
  const workspaceSlug = useAppShellContext()?.workspaceSlug;
  const router = useRouter();

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();

      const nextNotifications = data.notifications ?? [];
      const nextUnreadCount = data.unreadCount ?? 0;
      const nextPreferences = data.preferences ?? DEFAULT_PREFERENCES;

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      setPreferences({ ...DEFAULT_PREFERENCES, ...nextPreferences });

      return nextNotifications as Notification[];
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadNotifications().then((nextNotifications) => {
      if (!cancelled) {
        setSelectedId((current) => {
          if (current) {
            return current;
          }

          return initialSelectedId ?? nextNotifications[0]?.id ?? null;
        });
        setLoading(false);
      }
    });

    function handleNotificationEvent() {
      void loadNotifications();
    }

    window.addEventListener("notifications:changed", handleNotificationEvent);

    return () => {
      cancelled = true;
      window.removeEventListener(
        "notifications:changed",
        handleNotificationEvent,
      );
    };
  }, [initialSelectedId, loadNotifications]);

  const persistPreferences = useCallback(
    async (patch: Partial<InboxDisplayPreferences>) => {
      const previousPreferences = preferences;
      const nextPreferences = { ...preferences, ...patch };
      setPreferences(nextPreferences);

      try {
        const response = await fetch("/api/notifications/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: patch }),
        });

        if (!response.ok) {
          throw new Error("Failed to persist inbox display preferences");
        }
      } catch {
        setPreferences(previousPreferences);
      }
    },
    [preferences],
  );

  const replaceNotification = useCallback(
    (id: string, patch: Partial<Notification>) => {
      setNotifications((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const markNotificationRead = useCallback(
    async (id: string) => {
      const notification = notifications.find((item) => item.id === id);
      if (!notification || notification.readAt) {
        return;
      }

      const nextReadAt = new Date().toISOString();
      const previousNotifications = notifications;
      const previousUnreadCount = unreadCount;

      replaceNotification(id, { readAt: nextReadAt });
      const nextUnreadCount = Math.max(0, unreadCount - 1);
      setUnreadCount(nextUnreadCount);
      emitNotificationChange(nextUnreadCount);

      try {
        const response = await fetch(`/api/notifications/${id}/read`, {
          method: "PATCH",
        });

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }
      } catch {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        emitNotificationChange(previousUnreadCount);
      }
    },
    [notifications, replaceNotification, unreadCount],
  );

  const markNotificationUnread = useCallback(
    async (id: string) => {
      const notification = notifications.find((item) => item.id === id);
      if (!notification || notification.readAt === null) {
        return;
      }

      const previousNotifications = notifications;
      const previousUnreadCount = unreadCount;

      replaceNotification(id, { readAt: null });
      const nextUnreadCount = unreadCount + 1;
      setUnreadCount(nextUnreadCount);
      emitNotificationChange(nextUnreadCount);

      try {
        const response = await fetch(`/api/notifications/${id}/unread`, {
          method: "PATCH",
        });

        if (!response.ok) {
          throw new Error("Failed to mark notification as unread");
        }
      } catch {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        emitNotificationChange(previousUnreadCount);
      }
    },
    [notifications, replaceNotification, unreadCount],
  );

  const snoozeNotification = useCallback(
    async (id: string) => {
      const previousNotifications = notifications;
      const snoozedUntilAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      replaceNotification(id, { snoozedUntilAt, unsnoozedAt: null });

      try {
        const response = await fetch(`/api/notifications/${id}/snooze`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ snoozedUntilAt }),
        });

        if (!response.ok) {
          throw new Error("Failed to snooze notification");
        }
      } catch {
        setNotifications(previousNotifications);
      }
    },
    [notifications, replaceNotification],
  );

  const unsnoozeNotification = useCallback(
    async (id: string) => {
      const previousNotifications = notifications;
      replaceNotification(id, {
        snoozedUntilAt: null,
        unsnoozedAt: new Date().toISOString(),
      });

      try {
        const response = await fetch(`/api/notifications/${id}/snooze`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to unsnooze notification");
        }
      } catch {
        setNotifications(previousNotifications);
      }
    },
    [notifications, replaceNotification],
  );

  const bulkMarkRead = useCallback(async () => {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const now = new Date().toISOString();

    const nextNotifications = notifications.map((notification) =>
      notification.readAt === null && notification.type !== "comment"
        ? { ...notification, readAt: now }
        : notification,
    );
    const nextUnreadCount = getUnreadCount(nextNotifications);

    setNotifications(nextNotifications);
    setUnreadCount(nextUnreadCount);
    emitNotificationChange(nextUnreadCount);

    try {
      const response = await fetch("/api/notifications/bulk-read", {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to bulk mark notifications as read");
      }
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      emitNotificationChange(previousUnreadCount);
    }
  }, [notifications, unreadCount]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      router.push(
        withWorkspaceSlug(`/inbox/notification/${id}`, workspaceSlug),
      );
      void markNotificationRead(id);
    },
    [markNotificationRead, router, workspaceSlug],
  );

  const visibleNotifications = useMemo(
    () =>
      [...notifications]
        .filter(
          (notification) => preferences.showReadItems || !notification.readAt,
        )
        .filter(
          (notification) => !showUnreadOnly || notification.readAt === null,
        )
        .filter(
          (notification) =>
            preferences.showSnoozedItems || !isSnoozed(notification),
        )
        .sort((left, right) => {
          if (preferences.showUnreadItemsFirst) {
            const unreadDiff =
              Number(left.readAt !== null) - Number(right.readAt !== null);
            if (unreadDiff !== 0) {
              return unreadDiff;
            }
          }

          if (sortMode === "priority") {
            const priorityDiff =
              PRIORITY_SORT_ORDER[left.issuePriority] -
              PRIORITY_SORT_ORDER[right.issuePriority];

            if (priorityDiff !== 0) {
              return priorityDiff;
            }
          }

          return (
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime()
          );
        }),
    [notifications, preferences, showUnreadOnly, sortMode],
  );

  useEffect(() => {
    if (visibleNotifications.length === 0) {
      return;
    }

    if (
      selectedId &&
      !visibleNotifications.some(
        (notification) => notification.id === selectedId,
      )
    ) {
      if (initialSelectedId && selectedId === initialSelectedId) {
        return;
      }

      setSelectedId(visibleNotifications[0]?.id ?? null);
      return;
    }

    if (!selectedId) {
      setSelectedId(visibleNotifications[0]?.id ?? null);
    }
  }, [initialSelectedId, selectedId, visibleNotifications]);

  const selected =
    notifications.find((notification) => notification.id === selectedId) ??
    null;
  const selectedIsHidden = Boolean(
    selected &&
      !visibleNotifications.some(
        (notification) => notification.id === selected.id,
      ),
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-[13px] text-[#6b6f76]">Loading...</span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="You're all caught up"
        description="When you're assigned to issues, mentioned, or receive updates, notifications will appear here."
        icon={
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b6f76"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            role="img"
            aria-label="Inbox"
          >
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
            <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
          </svg>
        }
      />
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <h1 className="text-[18px] font-semibold text-[var(--color-text-primary)]">
          Inbox
        </h1>
        {unreadCount > 0 && (
          <span className="text-[12px] text-[#6b6f76]">
            {unreadCount} unread
          </span>
        )}
        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            aria-label="Mark non-comment notifications as read"
            onClick={() => void bulkMarkRead()}
            data-editorial-control="true"
            className="rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--editorial-line-strong)] hover:text-[var(--color-text-primary)]"
          >
            Mark non-comments read
          </button>
          <button
            type="button"
            aria-label="Toggle read notifications visibility"
            onClick={() =>
              void persistPreferences({
                showReadItems: !preferences.showReadItems,
              })
            }
            data-editorial-control="true"
            className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
              preferences.showReadItems
                ? "border-[var(--color-surface-active-line)] bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--editorial-line-strong)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Read: {preferences.showReadItems ? "Shown" : "Hidden"}
          </button>
          <button
            type="button"
            aria-label="Toggle unread-first inbox ordering"
            onClick={() =>
              void persistPreferences({
                showUnreadItemsFirst: !preferences.showUnreadItemsFirst,
              })
            }
            data-editorial-control="true"
            className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
              preferences.showUnreadItemsFirst
                ? "border-[var(--color-surface-active-line)] bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--editorial-line-strong)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Unread first: {preferences.showUnreadItemsFirst ? "On" : "Off"}
          </button>
          <button
            type="button"
            aria-label="Toggle snoozed notifications visibility"
            onClick={() =>
              void persistPreferences({
                showSnoozedItems: !preferences.showSnoozedItems,
              })
            }
            data-editorial-control="true"
            className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
              preferences.showSnoozedItems
                ? "border-[var(--color-surface-active-line)] bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--editorial-line-strong)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Snoozed: {preferences.showSnoozedItems ? "Shown" : "Hidden"}
          </button>
          <button
            type="button"
            aria-label="Filter inbox notifications"
            onClick={() => setShowUnreadOnly((current) => !current)}
            data-editorial-control="true"
            className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
              showUnreadOnly
                ? "border-[var(--color-surface-active-line)] bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--editorial-line-strong)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Filter: {showUnreadOnly ? "Unread" : "All"}
          </button>
          <button
            type="button"
            aria-label="Sort inbox notifications by priority"
            onClick={() =>
              setSortMode((current) =>
                current === "latest" ? "priority" : "latest",
              )
            }
            data-editorial-control="true"
            className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
              sortMode === "priority"
                ? "border-[var(--color-surface-active-line)] bg-[var(--color-surface-active)] text-[var(--color-text-primary)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--editorial-line-strong)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Sort: {sortMode === "priority" ? "Priority" : "Latest"}
          </button>
        </div>
      </div>

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(300px,380px)_minmax(360px,1fr)]">
        <div className="min-w-0 overflow-y-auto border-r border-[var(--color-border)]">
          {visibleNotifications.length > 0 ? (
            <div className="flex flex-col gap-0.5 p-1.5">
              {visibleNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  id={notification.id}
                  type={notification.type}
                  actorName={notification.actorName}
                  actorImage={notification.actorImage}
                  issueIdentifier={notification.issueIdentifier}
                  issueTitle={notification.issueTitle}
                  readAt={notification.readAt}
                  snoozedUntilAt={notification.snoozedUntilAt}
                  createdAt={notification.createdAt}
                  isSelected={notification.id === selectedId}
                  onClick={handleSelect}
                />
              ))}
              {unreadCount === 0 && (
                <div className="px-3 py-4 text-center text-[12px] text-[#6b6f76]">
                  No unread notifications
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-[#6b6f76]">
              {showUnreadOnly
                ? "No unread notifications match the current filter."
                : "No notifications to display."}
            </div>
          )}
        </div>

        <div className="hidden min-w-0 overflow-y-auto p-6 lg:block">
          {selected ? (
            <div className="mx-auto max-w-[68ch]">
              {selectedIsHidden && (
                <div className="mb-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-[12px] text-[var(--color-text-secondary)]">
                  This notification is hidden by the current display options.
                </div>
              )}
              <div className="mb-2 font-mono text-[12px] uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                {selected.issueIdentifier || "Notification"}
              </div>
              <h2 className="mb-4 [overflow-wrap:anywhere] text-pretty break-words text-[24px] font-semibold leading-[1.18] text-[var(--color-text-primary)]">
                {selected.issueTitle || "Inbox notification"}
              </h2>
              <p className="text-[14px] leading-6 text-[var(--color-text-secondary)]">
                <span className="font-medium text-[var(--color-text-primary)]">
                  {selected.actorName}
                </span>{" "}
                {selected.type === "assigned" && "assigned this issue to you"}
                {selected.type === "mentioned" && "mentioned you in this issue"}
                {selected.type === "status_change" &&
                  "changed the status of this issue"}
                {selected.type === "comment" && "commented on this issue"}
                {selected.type === "duplicate" &&
                  "marked this issue as duplicate"}
              </p>
              {selected.snoozedUntilAt && isSnoozed(selected) && (
                <p className="mt-3 text-[12px] text-[var(--color-text-secondary)]">
                  Snoozed until {formatSnoozedUntil(selected.snoozedUntilAt)}
                </p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label={
                    selected.readAt
                      ? "Mark notification unread"
                      : "Mark notification read"
                  }
                  onClick={() =>
                    selected.readAt
                      ? void markNotificationUnread(selected.id)
                      : void markNotificationRead(selected.id)
                  }
                  className="inline-flex rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-text-primary)] hover:border-[var(--editorial-line-strong)]"
                >
                  Mark {selected.readAt ? "unread" : "read"}
                </button>
                <button
                  type="button"
                  aria-label={
                    isSnoozed(selected)
                      ? "Unsnooze notification"
                      : "Snooze notification"
                  }
                  onClick={() =>
                    isSnoozed(selected)
                      ? void unsnoozeNotification(selected.id)
                      : void snoozeNotification(selected.id)
                  }
                  className="inline-flex rounded-md border border-[var(--color-border)] px-2.5 py-1 text-[12px] font-semibold text-[var(--color-text-primary)] hover:border-[var(--editorial-line-strong)]"
                >
                  {isSnoozed(selected) ? "Unsnooze" : "Snooze 1 day"}
                </button>
                {selected.issueIdentifier && (
                  <Link
                    href={withWorkspaceSlug(
                      `/issue/${selected.issueIdentifier}`,
                      workspaceSlug,
                    )}
                    className="inline-flex text-[12px] font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                  >
                    Open issue
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[13px] text-[#6b6f76]">
                {initialSelectedId
                  ? "Notification not found. It may have been deleted or belongs to another workspace."
                  : "Select a notification to view details"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
