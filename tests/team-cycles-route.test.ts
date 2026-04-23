import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const getTeamIdByKeyMock = vi.fn();
const teamLimitMock = vi.fn();
const cyclesOrderByMock = vi.fn();
const completedStatesWhereMock = vi.fn();
const totalCountWhereMock = vi.fn();
const completedCountWhereMock = vi.fn();
const lastCycleLimitMock = vi.fn();
const existingCyclesWhereMock = vi.fn();
const insertValuesMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/teams", () => ({
  getTeamIdByKey: getTeamIdByKeyMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection?: Record<string, unknown>) => {
      if (selection && "cyclesEnabled" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: teamLimitMock,
            }),
          }),
        };
      }

      if (!selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: cyclesOrderByMock,
            }),
          }),
        };
      }

      if (selection && "number" in selection && Object.keys(selection).length > 1) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: cyclesOrderByMock,
            }),
          }),
        };
      }

      if (selection && Object.keys(selection).length === 1 && "id" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: (...whereArgs: unknown[]) => {
              completedStatesWhereMock(...whereArgs);
              return Promise.resolve([{ id: "done-state" }]);
            },
          }),
        };
      }

      if (selection && Object.keys(selection).length === 1 && "value" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: (...whereArgs: unknown[]) => {
              if (totalCountWhereMock.mock.calls.length === 0) {
                totalCountWhereMock(...whereArgs);
                return Promise.resolve([{ value: 2 }]);
              }
              completedCountWhereMock(...whereArgs);
              return Promise.resolve([{ value: 1 }]);
            },
          }),
        };
      }

      if (selection && Object.keys(selection).length === 1 && "number" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: lastCycleLimitMock,
              }),
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: (...whereArgs: unknown[]) => {
            existingCyclesWhereMock(...whereArgs);
            return Promise.resolve([
              {
                id: "cycle-1",
                startDate: new Date("2026-04-01T00:00:00.000Z"),
                endDate: new Date("2026-04-14T00:00:00.000Z"),
              },
            ]);
          },
        }),
      };
    }),
    insert: vi.fn(() => ({
      values: (...valuesArgs: unknown[]) => {
        insertValuesMock(...valuesArgs);
        return {
          returning: vi.fn().mockResolvedValue([
            {
              id: "cycle-2",
              name: "Cycle 2",
              number: 2,
              teamId: "team-1",
              startDate: new Date("2026-04-15T00:00:00.000Z"),
              endDate: new Date("2026-04-28T00:00:00.000Z"),
              autoRollover: true,
            },
          ]),
        };
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team cycles route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    getTeamIdByKeyMock.mockResolvedValue("team-1");
    teamLimitMock.mockResolvedValue([
      {
        id: "team-1",
        name: "Engineering",
        key: "ENG",
        cyclesEnabled: true,
        cycleStartDay: 1,
        cycleDurationWeeks: 2,
        timezone: "Asia/Seoul",
      },
    ]);
    cyclesOrderByMock.mockResolvedValue([
      {
        id: "cycle-1",
        name: "Cycle 1",
        number: 1,
        teamId: "team-1",
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        endDate: new Date("2026-04-14T00:00:00.000Z"),
        autoRollover: true,
        createdAt: new Date("2026-03-31T00:00:00.000Z"),
        updatedAt: new Date("2026-03-31T00:00:00.000Z"),
      },
    ]);
    lastCycleLimitMock.mockResolvedValue([{ number: 1 }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/cycles"),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns team cycles with issue counts", async () => {
    const { GET } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/cycles"),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      team: {
        id: "team-1",
        name: "Engineering",
        key: "ENG",
        cyclesEnabled: true,
        cycleStartDay: 1,
        cycleDurationWeeks: 2,
        timezone: "Asia/Seoul",
      },
      cycles: [
        {
          id: "cycle-1",
          name: "Cycle 1",
          number: 1,
          teamId: "team-1",
          startDate: "2026-04-01T00:00:00.000Z",
          endDate: "2026-04-14T00:00:00.000Z",
          autoRollover: true,
          createdAt: "2026-03-31T00:00:00.000Z",
          updatedAt: "2026-03-31T00:00:00.000Z",
          issueCount: 2,
          completedIssueCount: 1,
        },
      ],
    });
  });

  it("returns 404 when posting to a missing team", async () => {
    getTeamIdByKeyMock.mockResolvedValue(null);
    const { POST } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await POST(
      new Request("http://localhost/api/teams/NOPE/cycles", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2026-04-15",
          endDate: "2026-04-28",
        }),
      }),
      { params: Promise.resolve({ key: "NOPE" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });

  it("rejects invalid cycle dates", async () => {
    const { POST } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await POST(
      new Request("http://localhost/api/teams/ENG/cycles", {
        method: "POST",
        body: JSON.stringify({ startDate: "bad", endDate: "2026-04-28" }),
      }),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Start and end dates must use YYYY-MM-DD format",
    });
  });

  it("rejects overlapping cycle windows", async () => {
    const { POST } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await POST(
      new Request("http://localhost/api/teams/ENG/cycles", {
        method: "POST",
        body: JSON.stringify({
          startDate: "2026-04-10",
          endDate: "2026-04-20",
        }),
      }),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Cycle dates overlap with an existing cycle",
    });
  });

  it("creates the next cycle when dates are valid", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select)
      .mockImplementationOnce(
        (selection: Record<string, unknown>) =>
          ({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockReturnValue({
                  limit: lastCycleLimitMock,
                }),
              }),
            }),
          }) as never,
      )
      .mockImplementationOnce(
        (selection: Record<string, unknown>) =>
          ({
            from: vi.fn().mockReturnValue({
              where: () => Promise.resolve([]),
            }),
          }) as never,
      );

    const { POST } = await import("@/app/api/teams/[key]/cycles/route");

    const response = await POST(
      new Request("http://localhost/api/teams/ENG/cycles", {
        method: "POST",
        body: JSON.stringify({
          name: "Cycle 2",
          startDate: "2026-04-15",
          endDate: "2026-04-28",
          autoRollover: true,
        }),
      }),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(201);
    expect(insertValuesMock).toHaveBeenCalledWith({
      name: "Cycle 2",
      number: 2,
      teamId: "team-1",
      startDate: new Date("2026-04-15T00:00:00.000Z"),
      endDate: new Date("2026-04-28T00:00:00.000Z"),
      autoRollover: true,
    });
  });
});
