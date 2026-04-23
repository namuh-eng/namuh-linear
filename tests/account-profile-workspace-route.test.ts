import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const remainingMembershipLimitMock = vi.fn();
const deleteWhereMock = vi.fn();

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
    delete: vi.fn(() => ({
      where: (...whereArgs: unknown[]) => {
        deleteWhereMock(...whereArgs);
        return Promise.resolve();
      },
    })),
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: remainingMembershipLimitMock,
          }),
        }),
      }),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("account profile workspace route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
    remainingMembershipLimitMock.mockResolvedValue([
      { workspaceId: "workspace-2" },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { DELETE } = await import(
      "@/app/api/account/profile/workspace/route"
    );

    const response = await DELETE();

    expect(response.status).toBe(401);
  });

  it("returns 404 when there is no active workspace", async () => {
    resolveActiveWorkspaceIdMock.mockResolvedValue(null);
    const { DELETE } = await import(
      "@/app/api/account/profile/workspace/route"
    );

    const response = await DELETE();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No active workspace found",
    });
  });

  it("removes the current membership and points to the next workspace", async () => {
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

  it("redirects to workspace creation when no memberships remain", async () => {
    remainingMembershipLimitMock.mockResolvedValue([]);
    const { DELETE } = await import(
      "@/app/api/account/profile/workspace/route"
    );

    const response = await DELETE();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      redirectTo: "/create-workspace",
    });
    expect(response.cookies.get("activeWorkspaceId")).toMatchObject({
      name: "activeWorkspaceId",
      value: "",
    });
  });
});
