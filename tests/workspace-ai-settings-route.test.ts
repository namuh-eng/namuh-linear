import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const workspaceLimitMock = vi.fn();
const updateSetMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@/lib/active-workspace", () => ({
  resolveActiveWorkspaceId: resolveActiveWorkspaceIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        innerJoin: vi.fn().mockReturnValue({ limit: workspaceLimitMock }),
      }),
    })),
    update: vi.fn(() => ({
      set: (...args: unknown[]) => {
        updateSetMock(...args);
        return { where: vi.fn().mockResolvedValue(undefined) };
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("workspace AI settings route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
    workspaceLimitMock.mockResolvedValue([
      {
        id: "workspace-1",
        role: "admin",
        settings: {
          ai: {
            enabled: true,
            agentRunsEnabled: true,
            agentGuidance: "Cite workspace evidence.",
          },
          security: { permissions: { agentGuidanceRole: "members" } },
        },
      },
    ]);
  });

  it("returns persisted AI settings and admin capability", async () => {
    const { GET } = await import("@/app/api/workspaces/current/ai/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ai: {
        enabled: true,
        agentRunsEnabled: true,
        agentGuidance: "Cite workspace evidence.",
        agentGuidanceRole: "members",
        canManageSettings: true,
      },
    });
  });

  it("merges updates into workspace settings", async () => {
    const { PATCH } = await import("@/app/api/workspaces/current/ai/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/current/ai", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: false,
          agentRunsEnabled: false,
          agentGuidance: "No destructive changes.",
          agentGuidanceRole: "admins",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          ai: {
            enabled: false,
            agentRunsEnabled: false,
            agentGuidance: "No destructive changes.",
          },
          security: {
            permissions: { agentGuidanceRole: "admins" },
          },
        }),
      }),
    );
  });

  it("blocks non-admin mutations", async () => {
    workspaceLimitMock.mockResolvedValueOnce([
      { id: "workspace-1", role: "member", settings: {} },
    ]);
    const { PATCH } = await import("@/app/api/workspaces/current/ai/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/current/ai", {
        method: "PATCH",
        body: JSON.stringify({ enabled: false }),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("validates patch types", async () => {
    const { PATCH } = await import("@/app/api/workspaces/current/ai/route");

    const response = await PATCH(
      new Request("http://localhost/api/workspaces/current/ai", {
        method: "PATCH",
        body: JSON.stringify({ enabled: "nope" }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
