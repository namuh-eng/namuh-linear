import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findAccessibleTeamMock = vi.fn();
const statesOrderByMock = vi.fn();
const issueGroupByMock = vi.fn();

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
      if ("category" in selection && "position" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: statesOrderByMock,
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            groupBy: issueGroupByMock,
          }),
        }),
      };
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
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    findAccessibleTeamMock.mockResolvedValue({
      id: "team-1",
      key: "ENG",
      name: "Engineering",
    });
    statesOrderByMock.mockResolvedValue([
      {
        id: "triage-1",
        name: "Triage",
        category: "triage",
        color: "#aaa",
        description: "Needs review",
        position: 1,
        isDefault: null,
      },
      {
        id: "backlog-1",
        name: "Backlog",
        category: "backlog",
        color: "#bbb",
        description: "Queued",
        position: 2,
        isDefault: true,
      },
      {
        id: "done-1",
        name: "Done",
        category: "completed",
        color: "#0f0",
        description: "Finished",
        position: 3,
        isDefault: null,
      },
    ]);
    issueGroupByMock.mockResolvedValue([
      { stateId: "backlog-1", count: 4 },
      { stateId: "done-1", count: 2 },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/statuses/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/statuses"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when the team is inaccessible", async () => {
    findAccessibleTeamMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/statuses/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/statuses"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });

  it("returns statuses grouped by category with issue counts", async () => {
    const { GET } = await import("@/app/api/teams/[key]/statuses/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/statuses"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      statuses: {
        triage: [
          {
            id: "triage-1",
            name: "Triage",
            issueCount: 0,
            description: "Needs review",
            color: "#aaa",
            isDefault: null,
          },
        ],
        backlog: [
          {
            id: "backlog-1",
            name: "Backlog",
            issueCount: 4,
            description: "Queued",
            color: "#bbb",
            isDefault: true,
          },
        ],
        unstarted: [],
        started: [],
        completed: [
          {
            id: "done-1",
            name: "Done",
            issueCount: 2,
            description: "Finished",
            color: "#0f0",
            isDefault: null,
          },
        ],
        canceled: [],
      },
    });
  });
});
