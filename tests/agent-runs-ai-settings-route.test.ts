import { beforeEach, describe, expect, it, vi } from "vitest";

const requireApiSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const workspaceLimitMock = vi.fn();

vi.mock("@/lib/api-auth", () => ({
  requireApiSession: requireApiSessionMock,
}));

vi.mock("@/lib/active-workspace", () => ({
  resolveActiveWorkspaceId: resolveActiveWorkspaceIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit: workspaceLimitMock }),
      }),
    })),
  },
}));

describe("agent runs workspace AI gating", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    requireApiSessionMock.mockResolvedValue({
      response: null,
      session: { user: { id: "user-1", name: "User", email: "u@example.com" } },
    });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
  });

  it("reports disabled creation when workspace AI is off", async () => {
    workspaceLimitMock.mockResolvedValueOnce([
      { settings: { ai: { enabled: false, agentRunsEnabled: true } } },
    ]);
    const { GET } = await import("@/app/api/agent/runs/route");

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      canCreateRuns: false,
      createBlockedReason: "Workspace AI features are disabled",
    });
  });

  it("blocks creating runs when agent runs are disabled", async () => {
    workspaceLimitMock.mockResolvedValueOnce([
      { settings: { ai: { enabled: true, agentRunsEnabled: false } } },
    ]);
    const { POST } = await import("@/app/api/agent/runs/route");

    const response = await POST(
      new Request("http://localhost/api/agent/runs", {
        method: "POST",
        body: JSON.stringify({
          title: "Blocked run",
          prompt: "Inspect the issue and propose a safe fix.",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Workspace agent runs are disabled",
    });
  });
});
