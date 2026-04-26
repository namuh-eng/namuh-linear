import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findAccessibleTeamMock = vi.fn();
const statesOrderByMock = vi.fn();
const issueCountsGroupByMock = vi.fn();

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
    select: vi.fn((selection: Record<string, unknown>) => {
      // States lookup in GET
      if (selection && "isDefault" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(statesOrderByMock()),
            }),
          }),
        };
      }

      // issueCounts lookup in GET
      if (selection && "stateId" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockResolvedValue(issueCountsGroupByMock()),
            }),
          }),
        };
      }

      const chain = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        // biome-ignore lint/suspicious/noThenProperty: <explanation>
        then: (resolve: (val: unknown) => void) => resolve([]),
      };
      return chain;
    }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team statuses route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findAccessibleTeamMock.mockResolvedValue({
      id: "team-1",
      name: "Engineering",
      key: "ENG",
    });
    statesOrderByMock.mockReturnValue([
      {
        id: "state-1",
        name: "Todo",
        category: "unstarted",
        color: "#999",
        position: 1,
        isDefault: true,
      },
    ]);
    issueCountsGroupByMock.mockReturnValue([{ stateId: "state-1", count: 12 }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/statuses/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "ENG" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when team is missing", async () => {
    findAccessibleTeamMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/statuses/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "MISSING" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns grouped team statuses with issue counts", async () => {
    const { GET } = await import("@/app/api/teams/[key]/statuses/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "ENG" }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.statuses.unstarted.length).toBe(1);
    expect(payload.statuses.unstarted[0].issueCount).toBe(12);
  });
});
