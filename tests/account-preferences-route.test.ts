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

vi.mock("@/lib/account-preferences", () => ({
  readAccountPreferencesFromUserSettings: vi.fn((settings: unknown) => ({
    theme: (settings as { theme?: string })?.theme ?? "system",
    compactMode: (settings as { compactMode?: boolean })?.compactMode ?? false,
  })),
  mergeAccountPreferences: vi.fn(
    (current: Record<string, unknown>, patch: Record<string, unknown>) => ({
      ...current,
      ...patch,
    }),
  ),
  writeAccountPreferencesToUserSettings: vi.fn(
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

describe("account preferences route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    userLimitMock.mockResolvedValue([
      { id: "user-1", settings: { theme: "dark" } },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/account/preferences/route");

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns 404 when the current user is missing", async () => {
    userLimitMock.mockResolvedValue([]);
    const { GET } = await import("@/app/api/account/preferences/route");

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "User not found" });
  });

  it("reads account preferences from user settings", async () => {
    const { GET } = await import("@/app/api/account/preferences/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      accountPreferences: {
        theme: "dark",
        compactMode: false,
      },
    });
  });

  it("rejects patch requests without accountPreferences", async () => {
    const { PATCH } = await import("@/app/api/account/preferences/route");

    const response = await PATCH(
      new Request("http://localhost/api/account/preferences", {
        method: "PATCH",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "accountPreferences is required",
    });
  });

  it("merges and persists updated account preferences", async () => {
    const { PATCH } = await import("@/app/api/account/preferences/route");

    const response = await PATCH(
      new Request("http://localhost/api/account/preferences", {
        method: "PATCH",
        body: JSON.stringify({
          accountPreferences: { compactMode: true },
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: { theme: "dark", compactMode: true },
        updatedAt: expect.any(Date),
      }),
    );
    expect(updateWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      accountPreferences: {
        theme: "dark",
        compactMode: true,
      },
    });
  });
});
