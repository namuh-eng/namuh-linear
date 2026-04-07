import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const userLimitMock = vi.fn();
const workspaceLimitMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();
const deleteWhereMock = vi.fn();
const membershipLimitMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/active-workspace", () => ({
  resolveActiveWorkspaceId: resolveActiveWorkspaceIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection: Record<string, unknown>) => {
      if (
        "name" in selection &&
        "email" in selection &&
        "settings" in selection
      ) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: userLimitMock,
            }),
          }),
        };
      }

      if ("name" in selection && Object.keys(selection).length === 2) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: workspaceLimitMock,
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: membershipLimitMock,
            }),
          }),
        }),
      };
    }),
    update: vi.fn(() => ({
      set: (...args: unknown[]) => {
        updateSetMock(...args);
        return {
          where: (...whereArgs: unknown[]) => {
            updateWhereMock(...whereArgs);
            return Promise.resolve();
          },
        };
      },
    })),
    delete: vi.fn(() => ({
      where: (...whereArgs: unknown[]) => {
        deleteWhereMock(...whereArgs);
        return Promise.resolve();
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("account profile routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userLimitMock.mockResolvedValue([
      {
        id: "user-1",
        name: "John Doe",
        email: "john@example.com",
        image: "https://example.com/avatar.png",
        settings: {
          accountProfile: {
            username: "johnd",
          },
        },
      },
    ]);
    workspaceLimitMock.mockResolvedValue([
      {
        id: "workspace-1",
        name: "Onboarding QA Team",
      },
    ]);
    membershipLimitMock.mockResolvedValue([{ workspaceId: "workspace-2" }]);
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
  });

  it("loads persisted username data for the current session", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });

    const { GET } = await import("@/app/api/account/profile/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      profile: {
        name: "John Doe",
        email: "john@example.com",
        username: "johnd",
        image: "https://example.com/avatar.png",
      },
      workspaceAccess: {
        currentWorkspaceId: "workspace-1",
        currentWorkspaceName: "Onboarding QA Team",
      },
    });
  });

  it("persists username updates inside user settings", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });

    const { PATCH } = await import("@/app/api/account/profile/route");
    const response = await PATCH(
      new Request("http://localhost/api/account/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Jane Doe",
          username: "JaneD",
          image: "data:image/png;base64,abc123",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jane Doe",
        image: "data:image/png;base64,abc123",
        settings: expect.objectContaining({
          accountProfile: {
            username: "janed",
          },
        }),
      }),
    );
    await expect(response.json()).resolves.toEqual({
      profile: {
        name: "Jane Doe",
        email: "john@example.com",
        username: "janed",
        image: "data:image/png;base64,abc123",
      },
      workspaceAccess: {
        currentWorkspaceId: "workspace-1",
        currentWorkspaceName: "Onboarding QA Team",
      },
    });
  });

  it("removes the active workspace membership and points the user to the next workspace", async () => {
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });

    const { DELETE } = await import(
      "@/app/api/account/profile/workspace/route"
    );
    const response = await DELETE();

    expect(response.status).toBe(200);
    expect(deleteWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      success: true,
      redirectTo: "/",
    });
    expect(response.cookies.get("activeWorkspaceId")?.value).toBe(
      "workspace-2",
    );
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);

    const { GET } = await import("@/app/api/account/profile/route");
    const response = await GET();

    expect(response.status).toBe(401);
  });
});
