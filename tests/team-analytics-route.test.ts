import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findAccessibleTeamMock = vi.fn();
const selectCallCount = { value: 0 };

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/teams", () => ({
  findAccessibleTeam: findAccessibleTeamMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => {
      selectCallCount.value += 1;

      if (selectCallCount.value === 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      };
    }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team analytics route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    selectCallCount.value = 0;
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findAccessibleTeamMock.mockResolvedValue({
      id: "team-1",
      name: "Engineering",
      key: "ENG",
      workspaceId: "workspace-1",
    });
  });

  it("returns 404 for a team outside the active workspace", async () => {
    findAccessibleTeamMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/analytics/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "FOREIGN" }),
    });

    expect(response.status).toBe(404);
  });

  it("handles empty completed states with zero velocity", async () => {
    const { GET } = await import("@/app/api/teams/[key]/analytics/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "ENG" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      team: { id: "team-1", name: "Engineering" },
      cycleMetrics: [],
      velocity: 0,
    });
  });
});
