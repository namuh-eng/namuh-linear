import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const userLimitMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/account-notifications", () => ({
  readAccountNotificationsFromUserSettings: vi.fn((settings: unknown) => ({
    email: (settings as { email?: boolean })?.email ?? true,
    push: (settings as { push?: boolean })?.push ?? false,
  })),
  mergeAccountNotificationSettings: vi.fn(
    (current: Record<string, unknown>, patch: Record<string, unknown>) => ({
      ...current,
      ...patch,
    }),
  ),
  writeAccountNotificationsToUserSettings: vi.fn(
    (settings: Record<string, unknown>, next: Record<string, unknown>) => ({
      ...settings,
      ...next,
    }),
  ),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: userLimitMock,
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: (...setArgs: unknown[]) => {
        updateSetMock(...setArgs);
        return {
          where: (...whereArgs: unknown[]) => {
            updateWhereMock(...whereArgs);
            return Promise.resolve();
          },
        };
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("account notifications route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    userLimitMock.mockResolvedValue([
      { id: "user-1", settings: { email: false } },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/account/notifications/route");

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 404 when the current user is missing", async () => {
    userLimitMock.mockResolvedValue([]);
    const { GET } = await import("@/app/api/account/notifications/route");

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "User not found" });
  });

  it("reads account notifications from user settings", async () => {
    const { GET } = await import("@/app/api/account/notifications/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accountNotifications: {
        email: false,
        push: false,
      },
    });
  });

  it("rejects patch requests without accountNotifications", async () => {
    const { PATCH } = await import("@/app/api/account/notifications/route");

    const response = await PATCH(
      new Request("http://localhost/api/account/notifications", {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "accountNotifications is required",
    });
  });

  it("merges and persists updated account notifications", async () => {
    const { PATCH } = await import("@/app/api/account/notifications/route");

    const response = await PATCH(
      new Request("http://localhost/api/account/notifications", {
        method: "PATCH",
        body: JSON.stringify({
          accountNotifications: { push: true },
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: { email: false, push: true },
        updatedAt: expect.any(Date),
      }),
    );
    expect(updateWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      accountNotifications: {
        email: false,
        push: true,
      },
    });
  });
});
