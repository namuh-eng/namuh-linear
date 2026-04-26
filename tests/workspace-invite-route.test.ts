import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const membershipLimitMock = vi.fn();
const workspaceLimitMock = vi.fn();
const existingMemberInnerJoinMock = vi.fn();
const sendInvitationEmailMock = vi.fn();
const createInviteTokenMock = vi.fn();
const insertValuesMock = vi.fn();

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

vi.mock("@/lib/email", () => ({
  sendInvitationEmail: (
    email: string,
    ws: string,
    inviter: string,
    url: string,
  ) => sendInvitationEmailMock(email, ws, inviter, url),
}));

vi.mock("@/lib/invite-tokens", () => ({
  createInviteToken: (options: unknown) => createInviteTokenMock(options),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection: Record<string, unknown>) => {
      // workspace name lookup
      if (selection && "name" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue(workspaceLimitMock()),
            }),
          }),
        };
      }

      // existing member lookup (called in loop)
      if (selection && "id" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(existingMemberInnerJoinMock()),
              }),
            }),
          }),
        };
      }

      // membership lookup
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(membershipLimitMock()),
          }),
        }),
      };
    }),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(insertValuesMock()),
      }),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("workspace invite route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1", name: "Ashley" },
    });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
    membershipLimitMock.mockReturnValue([{ role: "admin" }]);
    workspaceLimitMock.mockReturnValue([{ name: "Namuh" }]);
    existingMemberInnerJoinMock.mockReturnValue([]);
    createInviteTokenMock.mockReturnValue("token-123");
    sendInvitationEmailMock.mockResolvedValue({ success: true });
    insertValuesMock.mockResolvedValue([{ id: "invite-1" }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/workspaces/invite/route");

    const response = await POST(
      new Request("http://localhost", { method: "POST" }),
    );

    expect(response.status).toBe(401);
  });

  it("sends invitations to valid emails", async () => {
    const { POST } = await import("@/app/api/workspaces/invite/route");

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          invites: [{ email: "new@test.com", role: "member" }],
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.results[0].status).toBe("sent");
    expect(sendInvitationEmailMock).toHaveBeenCalled();
  });

  it("blocks invites from non-admins", async () => {
    membershipLimitMock.mockReturnValue([{ role: "member" }]);
    const { POST } = await import("@/app/api/workspaces/invite/route");

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          invites: [{ email: "new@test.com", role: "member" }],
        }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
