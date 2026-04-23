import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const workspaceAccessLimitMock = vi.fn();
const webhookOrderByMock = vi.fn();
const apiKeyOrderByMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();
const workspaceInsertValuesMock = vi.fn();
const apiKeyInsertValuesMock = vi.fn();
const webhookInsertValuesMock = vi.fn();

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

vi.mock("@/lib/db", async () => {
  const schema = await import("@/lib/db/schema");

  return {
    db: {
      select: vi.fn((selection: Record<string, unknown>) => {
        if (
          "workspaceId" in selection &&
          "settings" in selection &&
          "memberRole" in selection
        ) {
          return {
            from: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                limit: workspaceAccessLimitMock,
              }),
            }),
          };
        }

        if (
          "id" in selection &&
          "label" in selection &&
          "url" in selection &&
          "events" in selection
        ) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: webhookOrderByMock,
              }),
            }),
          };
        }

        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: apiKeyOrderByMock,
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
      insert: vi.fn((table: unknown) => {
        if (table === schema.webhook) {
          return {
            values: (...args: unknown[]) => {
              webhookInsertValuesMock(...args);
              return Promise.resolve();
            },
          };
        }

        if (table === schema.apiKey) {
          return {
            values: (...args: unknown[]) => {
              apiKeyInsertValuesMock(...args);
              return Promise.resolve();
            },
          };
        }

        return {
          values: (...args: unknown[]) => {
            workspaceInsertValuesMock(...args);
            return Promise.resolve();
          },
        };
      }),
    },
  };
});

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

function buildAccess(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    workspaceId: "workspace-1",
    settings: {
      security: {
        permissions: {
          apiKeyCreationRole: "admins",
        },
      },
      api: {
        oauthApplications: [],
      },
    },
    memberRole: "owner",
    ...overrides,
  };
}

describe("workspace api route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
    workspaceAccessLimitMock.mockResolvedValue([buildAccess()]);
    webhookOrderByMock.mockResolvedValue([]);
    apiKeyOrderByMock.mockResolvedValue([]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/workspaces/current/api/route");

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 404 when there is no active workspace", async () => {
    resolveActiveWorkspaceIdMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/workspaces/current/api/route");

    const response = await GET();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No active workspace found",
    });
  });

  it("blocks permission updates for non-managers", async () => {
    workspaceAccessLimitMock.mockResolvedValue([
      buildAccess({ memberRole: "member" }),
    ]);
    const { PATCH } = await import("@/app/api/workspaces/current/api/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "PATCH",
        body: JSON.stringify({ permissionLevel: "members" }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("rejects unsupported actions", async () => {
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({ action: "rotateWebhook" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported action.",
    });
  });

  it("rejects api key creation when the viewer lacks permission", async () => {
    workspaceAccessLimitMock.mockResolvedValue([
      buildAccess({
        memberRole: "guest",
        settings: {
          security: {
            permissions: {
              apiKeyCreationRole: "members",
            },
          },
          api: {
            oauthApplications: [],
          },
        },
      }),
    ]);
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({
          action: "createApiKey",
          name: "Guest automation",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "You do not have permission to create API keys.",
    });
    expect(apiKeyInsertValuesMock).not.toHaveBeenCalled();
  });

  it("rejects malformed webhook creation requests", async () => {
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({
          action: "createWebhook",
          label: "Broken hook",
          url: "ftp://example.com/hook",
          events: [],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A webhook URL and at least one event are required.",
    });
    expect(webhookInsertValuesMock).not.toHaveBeenCalled();
  });
});
