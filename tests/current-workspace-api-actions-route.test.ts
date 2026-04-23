import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const accessLimitMock = vi.fn();
const webhooksOrderByMock = vi.fn();
const apiKeysOrderByMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();
const insertValuesMock = vi.fn();

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();

  return {
    ...actual,
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => "hash-123"),
    })),
    randomBytes: vi.fn((size: number) => ({
      toString: () => "a".repeat(size * 2),
    })),
  };
});

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

vi.mock("@/lib/api-settings", () => ({
  GRAPHQL_DOCS_URL: "https://docs.test/graphql",
  OAUTH_APPLICATIONS_DOCS_URL: "https://docs.test/oauth",
  WEBHOOKS_DOCS_URL: "https://docs.test/webhooks",
  asRecord: (value: unknown) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {},
  canManageWorkspaceApi: vi.fn(
    (role: string) => role === "owner" || role === "admin",
  ),
  canMemberCreateApiKeys: vi.fn((role: string, permissionLevel: string) => {
    if (role === "owner" || role === "admin") {
      return true;
    }

    return permissionLevel === "members";
  }),
  isPermissionLevel: vi.fn(
    (value: unknown) => value === "admins" || value === "members",
  ),
  normalizeWebhookEvents: vi.fn((events: unknown) =>
    Array.isArray(events)
      ? events.filter((event): event is string => typeof event === "string")
      : [],
  ),
  readPermissionLevel: vi.fn((value: unknown, fallback: string) =>
    value === "admins" || value === "members" ? value : fallback,
  ),
  readWorkspaceApiSettings: vi.fn(() => ({ oauthApplications: [] })),
  serializeWorkspaceApiSettings: vi.fn((value: unknown) => value),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection: Record<string, unknown>) => {
      if ("memberRole" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              limit: accessLimitMock,
            }),
          }),
        };
      }

      if ("label" in selection && "url" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: webhooksOrderByMock,
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: apiKeysOrderByMock,
            }),
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
    insert: vi.fn(() => ({
      values: (...valuesArgs: unknown[]) => {
        insertValuesMock(...valuesArgs);
        return Promise.resolve();
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("current workspace api actions route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
    accessLimitMock.mockResolvedValue([
      {
        workspaceId: "workspace-1",
        settings: {
          security: { permissions: { apiKeyCreationRole: "admins" } },
        },
        memberRole: "owner",
      },
    ]);
    webhooksOrderByMock.mockResolvedValue([]);
    apiKeysOrderByMock.mockResolvedValue([]);
  });

  it("requires an action", async () => {
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Action is required.",
    });
  });

  it("creates an oauth application for managers", async () => {
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({
          action: "createOAuthApplication",
          name: "Ever",
          redirectUrl: "https://ever.test/callback",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toMatchObject({
      createdCredential: {
        kind: "oauthApplication",
        label: "Ever client secret",
        secret: expect.stringContaining("linsec_"),
      },
    });
  });

  it("rejects invalid webhook payloads", async () => {
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({
          action: "createWebhook",
          label: "Prod",
          url: "not-a-url",
          events: [],
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A webhook URL and at least one event are required.",
    });
  });

  it("creates a webhook for managers", async () => {
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({
          action: "createWebhook",
          label: "Prod",
          url: "https://hooks.test/prod",
          events: ["issue.created", "issue.updated"],
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://hooks.test/prod",
        label: "Prod",
        workspaceId: "workspace-1",
        enabled: true,
        events: ["issue.created", "issue.updated"],
      }),
    );
  });

  it("blocks api key creation when the role lacks permission", async () => {
    accessLimitMock.mockResolvedValue([
      {
        workspaceId: "workspace-1",
        settings: {
          security: { permissions: { apiKeyCreationRole: "admins" } },
        },
        memberRole: "member",
      },
    ]);
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({ action: "createApiKey", name: "CLI" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "You do not have permission to create API keys.",
    });
  });

  it("creates an api key when permission allows it", async () => {
    accessLimitMock.mockResolvedValue([
      {
        workspaceId: "workspace-1",
        settings: {
          security: { permissions: { apiKeyCreationRole: "members" } },
        },
        memberRole: "member",
      },
    ]);
    const { POST } = await import("@/app/api/workspaces/current/api/route");

    const response = await POST(
      new Request("http://localhost/api/workspaces/current/api", {
        method: "POST",
        body: JSON.stringify({ action: "createApiKey", name: "CLI" }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "CLI",
        keyHash: expect.any(String),
        keyPrefix: expect.stringContaining("lin_api_"),
        userId: "user-1",
        workspaceId: "workspace-1",
      }),
    );
    await expect(response.json()).resolves.toMatchObject({
      createdCredential: {
        kind: "apiKey",
        label: "CLI API key",
        secret: expect.stringContaining("lin_api_"),
      },
    });
  });
});
