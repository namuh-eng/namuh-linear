import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceRefMock = vi.fn();
let selectCallCount = 0;

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/api-authz", () => ({
  resolveActiveWorkspaceRef: resolveActiveWorkspaceRefMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => {
      selectCallCount += 1;
      const rows =
        selectCallCount === 1
          ? [{ teamId: "team-1", teamName: "Engineering", completedCount: 2 }]
          : [{ teamId: "team-1", teamName: "Engineering", activeCount: 3 }];

      return {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockResolvedValue(rows),
              }),
            }),
          }),
        }),
      };
    }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("workspace analytics route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    selectCallCount = 0;
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveActiveWorkspaceRefMock.mockResolvedValue({
      workspaceId: "active-workspace",
    });
  });

  it("uses the active workspace resolver for analytics", async () => {
    const { GET } = await import("@/app/api/analytics/workspace/route");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(resolveActiveWorkspaceRefMock).toHaveBeenCalledWith("user-1");
    await expect(response.json()).resolves.toMatchObject({
      workspaceId: "active-workspace",
      completedLast30Days: [
        { teamId: "team-1", teamName: "Engineering", completedCount: 2 },
      ],
      activeIssues: [
        { teamId: "team-1", teamName: "Engineering", activeCount: 3 },
      ],
    });
  });

  it("returns 404 when there is no active workspace", async () => {
    resolveActiveWorkspaceRefMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/analytics/workspace/route");

    const response = await GET();

    expect(response.status).toBe(404);
  });
});
