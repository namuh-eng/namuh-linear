import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const membershipLimitMock = vi.fn();
const targetMemberLimitMock = vi.fn();
const ownerMembershipLimitMock = vi.fn();
const invitationLimitMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();

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
      if ("role" in selection && Object.keys(selection).length === 2) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: membershipLimitMock,
            }),
          }),
        };
      }

      if ("userId" in selection && "role" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: targetMemberLimitMock,
            }),
          }),
        };
      }

      if (Object.keys(selection).length === 1 && "id" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: ownerMembershipLimitMock,
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: invitationLimitMock,
          }),
        }),
      };
    }),
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

describe("workspace members route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
    membershipLimitMock.mockResolvedValue([
      {
        id: "membership-1",
        role: "admin",
      },
    ]);
    targetMemberLimitMock.mockResolvedValue([
      {
        id: "membership-2",
        userId: "user-2",
        role: "member",
      },
    ]);
    ownerMembershipLimitMock.mockResolvedValue([
      { id: "owner-1" },
      { id: "owner-2" },
    ]);
    invitationLimitMock.mockResolvedValue([{ id: "invite-1" }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/workspaces/members/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/members", {
        method: "PATCH",
        body: JSON.stringify({ id: "m2", kind: "member", role: "admin" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("rejects requests when there is no active workspace", async () => {
    resolveActiveWorkspaceIdMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/workspaces/members/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/members", {
        method: "PATCH",
        body: JSON.stringify({ id: "m2", kind: "member", role: "admin" }),
      }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No active workspace found",
    });
  });

  it("blocks non-managers from changing member roles", async () => {
    membershipLimitMock.mockResolvedValue([
      {
        id: "membership-1",
        role: "member",
      },
    ]);
    const { PATCH } = await import("@/app/api/workspaces/members/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/members", {
        method: "PATCH",
        body: JSON.stringify({ id: "m2", kind: "member", role: "admin" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "You do not have permission to manage members",
    });
  });

  it("prevents non-owners from assigning the owner role", async () => {
    const { PATCH } = await import("@/app/api/workspaces/members/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/members", {
        method: "PATCH",
        body: JSON.stringify({ id: "m2", kind: "member", role: "owner" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only owners can manage owner roles",
    });
  });

  it("keeps the last owner from being demoted", async () => {
    membershipLimitMock.mockResolvedValue([
      {
        id: "membership-1",
        role: "owner",
      },
    ]);
    targetMemberLimitMock.mockResolvedValue([
      {
        id: "membership-2",
        userId: "user-2",
        role: "owner",
      },
    ]);
    ownerMembershipLimitMock.mockResolvedValue([{ id: "owner-1" }]);
    const { PATCH } = await import("@/app/api/workspaces/members/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/members", {
        method: "PATCH",
        body: JSON.stringify({ id: "m2", kind: "member", role: "admin" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Each workspace must keep at least one owner",
    });
  });

  it("blocks admins from assigning owner to pending invitations", async () => {
    const { PATCH } = await import("@/app/api/workspaces/members/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/members", {
        method: "PATCH",
        body: JSON.stringify({
          id: "invite-1",
          kind: "invitation",
          role: "owner",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only owners can assign the owner role",
    });
    expect(updateSetMock).not.toHaveBeenCalled();
  });
});
