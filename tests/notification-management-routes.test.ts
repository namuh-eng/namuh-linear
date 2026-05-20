import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();
const updateReturningMock = vi.fn();
const selectLimitMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: selectLimitMock,
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: (...setArgs: unknown[]) => {
        updateSetMock(...setArgs);
        return {
          where: (...whereArgs: unknown[]) => {
            updateWhereMock(...whereArgs);
            return {
              returning: updateReturningMock,
            };
          },
        };
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("notification management routes", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    updateReturningMock.mockResolvedValue([{ id: "notif-1" }]);
    selectLimitMock.mockResolvedValue([
      {
        id: "user-1",
        settings: {
          inboxNotificationPreferences: {
            showReadItems: true,
            showUnreadItemsFirst: false,
            showSnoozedItems: false,
          },
        },
      },
    ]);
  });

  it("marks a notification unread", async () => {
    const { PATCH } = await import("@/app/api/notifications/[id]/unread/route");

    const response = await PATCH({} as never, {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith({ readAt: null });
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("bulk marks only scoped non-comment notifications read", async () => {
    updateReturningMock.mockResolvedValue([
      { id: "notif-1" },
      { id: "notif-2" },
    ]);
    const { PATCH } = await import("@/app/api/notifications/bulk-read/route");

    const response = await PATCH();

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith({ readAt: expect.any(Date) });
    expect(updateWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      success: true,
      updatedCount: 2,
    });
  });

  it("sets and clears snooze metadata", async () => {
    const route = await import("@/app/api/notifications/[id]/snooze/route");
    const snoozedUntilAt = "2026-05-21T12:00:00.000Z";

    const patchResponse = await route.PATCH(
      new Request("http://test", {
        method: "PATCH",
        body: JSON.stringify({ snoozedUntilAt }),
      }) as never,
      { params: Promise.resolve({ id: "notif-1" }) },
    );

    expect(patchResponse.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith({
      snoozedUntilAt: new Date(snoozedUntilAt),
      unsnoozedAt: null,
    });

    const deleteResponse = await route.DELETE({} as never, {
      params: Promise.resolve({ id: "notif-1" }),
    });

    expect(deleteResponse.status).toBe(200);
    expect(updateSetMock).toHaveBeenLastCalledWith({
      snoozedUntilAt: null,
      unsnoozedAt: expect.any(Date),
    });
  });

  it("persists inbox display preferences in user settings", async () => {
    const { PATCH } = await import("@/app/api/notifications/preferences/route");

    const response = await PATCH(
      new Request("http://test", {
        method: "PATCH",
        body: JSON.stringify({
          preferences: { showReadItems: false, showSnoozedItems: true },
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith({
      settings: {
        inboxNotificationPreferences: {
          showReadItems: false,
          showUnreadItemsFirst: false,
          showSnoozedItems: true,
        },
      },
      updatedAt: expect.any(Date),
    });
    await expect(response.json()).resolves.toEqual({
      preferences: {
        showReadItems: false,
        showUnreadItemsFirst: false,
        showSnoozedItems: true,
      },
    });
  });
});
