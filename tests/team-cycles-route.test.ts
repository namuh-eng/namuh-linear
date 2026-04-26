import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const teamLimitMock = vi.fn();
const cyclesOrderByMock = vi.fn();
const completedStatesWhereMock = vi.fn();
const countWhereMock = vi.fn();
let selectCallCount = 0;

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection: Record<string, unknown>) => {
      selectCallCount += 1;

      // primary team lookup
      if (selection && "timezone" in selection) {
        const chain = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(teamLimitMock()),
        };
        return chain;
      }

      // cycles list fetch
      if (selectCallCount === 2) {
        const chain = {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          // biome-ignore lint/suspicious/noThenProperty: <explanation>
          then: (resolve: (val: unknown) => void) =>
            resolve(cyclesOrderByMock()),
        };
        return chain;
      }

      // completed states lookup OR issue count lookup
      const chain = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        // biome-ignore lint/suspicious/noThenProperty: <explanation>
        then: (resolve: (val: unknown) => void) => resolve(countWhereMock()),
      };
      return chain;
    }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team cycles route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    selectCallCount = 0;
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    teamLimitMock.mockReturnValue([
      { id: "team-1", name: "Engineering", key: "ENG" },
    ]);
    cyclesOrderByMock.mockReturnValue([
      {
        id: "cycle-1",
        name: "Cycle 1",
        startDate: new Date("2026-04-01"),
        endDate: new Date("2026-04-14"),
      },
    ]);
    countWhereMock.mockReturnValue([{ value: 3 }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "ENG" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when team is missing", async () => {
    teamLimitMock.mockReturnValue([]);
    const { GET } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "MISSING" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns team cycles with counts", async () => {
    const { GET } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "ENG" }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.cycles.length).toBe(1);
    expect(payload.cycles[0].issueCount).toBe(3);
  });
});
