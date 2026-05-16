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
  createdAt: string;
}

function emitNotificationChange(unreadCount: number) {
  window.dispatchEvent(
    new CustomEvent("notifications:changed", {
      detail: { unreadCount },
    }),
  );
}

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [sortMode, setSortMode] = useState<"latest" | "priority">("latest");
  const workspaceSlug = useAppShellContext()?.workspaceSlug;
  const router = useRouter();

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();

      const nextNotifications = data.notifications ?? [];
      const nextUnreadCount = data.unreadCount ?? 0;

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);

      return nextNotifications;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadNotifications().then((nextNotifications) => {
      if (!cancelled) {
        setSelectedId(nextNotifications[0]?.id ?? null);
        setLoading(false);
      }
    });

    // Listen for real-time notification events
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
  }, [loadNotifications]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      const notification = notifications.find((item) => item.id === id);
      if (!notification || notification.readAt) {
        return;
      }

      const nextReadAt = new Date().toISOString();
      const previousNotifications = notifications;
      const previousUnreadCount = unreadCount;

      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: nextReadAt } : item,
        ),
      );
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
    [notifications, unreadCount],
  );

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      void markNotificationRead(id);
    },
    [markNotificationRead],
  );

  const handleActivate = useCallback(
    (id: string) => {
      setSelectedId(id);
      void markNotificationRead(id);

      const notification = notifications.find((item) => item.id === id);
      if (!notification?.issueIdentifier) {
        return;
      }

      router.push(
        withWorkspaceSlug(
          `/issue/${notification.issueIdentifier}`,
          workspaceSlug,
        ),
      );
    },
    [markNotificationRead, notifications, router, workspaceSlug],
  );

  const visibleNotifications = useMemo(
    () =>
      [...notifications]
        .filter(
          (notification) => !showUnreadOnly || notification.readAt === null,
        )
        .sort((left, right) => {
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
    [notifications, showUnreadOnly, sortMode],
  );

  useEffect(() => {
    if (visibleNotifications.length === 0) {
      setSelectedId(null);
      return;
    }

    if (
      !visibleNotifications.some(
        (notification) => notification.id === selectedId,
      )
    ) {
      setSelectedId(visibleNotifications[0]?.id ?? null);
    }
  }, [selectedId, visibleNotifications]);

  const selected =
    visibleNotifications.find(
      (notification) => notification.id === selectedId,
    ) ?? null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-[13px] text-[var(--color-text-secondary)]">
          Loading...
        </span>
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
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
        <h1 className="font-[var(--editorial-display)] text-[18px] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
          Inbox
        </h1>
        {unreadCount > 0 && (
          <span className="editorial-kicker">{unreadCount} unread</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Filter inbox notifications"
            onClick={() => setShowUnreadOnly((current) => !current)}
            className={`editorial-control rounded-md border px-2.5 py-1 transition-colors ${
              showUnreadOnly
                ? "border-[color-mix(in_oklab,var(--color-accent)_48%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-text-primary)] shadow-[inset_2px_0_0_var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
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
            className={`editorial-control rounded-md border px-2.5 py-1 transition-colors ${
              sortMode === "priority"
                ? "border-[color-mix(in_oklab,var(--color-accent)_48%,var(--color-border))] bg-[color-mix(in_oklab,var(--color-accent)_14%,transparent)] text-[var(--color-text-primary)] shadow-[inset_2px_0_0_var(--color-accent)]"
                : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Sort: {sortMode === "priority" ? "Priority" : "Latest"}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-full min-w-0 overflow-y-auto border-r border-[var(--color-border)] md:w-[min(400px,42%)] md:shrink-0">
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
                  createdAt={notification.createdAt}
                  isSelected={notification.id === selectedId}
                  onClick={
                    notification.issueIdentifier ? handleActivate : handleSelect
                  }
                />
              ))}
              {unreadCount === 0 && (
                <div className="px-3 py-4 text-center text-[12px] text-[var(--color-text-secondary)]">
                  No unread notifications
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-[var(--color-text-secondary)]">
              {showUnreadOnly
                ? "No unread notifications match the current filter."
                : "No notifications to display."}
            </div>
          )}
        </div>

        <div className="hidden min-w-[22rem] flex-1 overflow-y-auto overflow-x-hidden p-6 md:block">
          {selected ? (
            <div>
              <div className="editorial-kicker mb-2">
                {selected.issueIdentifier}
              </div>
              <h2 className="mb-4 max-w-[46rem] text-wrap break-words font-[var(--editorial-display)] text-[clamp(20px,2vw,30px)] font-semibold leading-[1.14] tracking-[-0.025em] text-[var(--color-text-primary)]">
                {selected.issueTitle}
              </h2>
              <p className="max-w-[42rem] text-[14px] leading-6 text-[var(--color-text-secondary)]">
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
              {selected.issueIdentifier && (
                <Link
                  href={withWorkspaceSlug(
                    `/issue/${selected.issueIdentifier}`,
                    workspaceSlug,
                  )}
                  className="editorial-control mt-4 inline-flex text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
                >
                  Open issue
                </Link>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                Select a notification to view details
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
