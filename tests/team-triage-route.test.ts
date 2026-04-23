import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const getTeamByKeyMock = vi.fn();
const triageStatesWhereMock = vi.fn();
const issuesOrderByMock = vi.fn();
const getLabelsForIssuesMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/teams", () => ({
  getTeamByKey: getTeamByKeyMock,
}));

vi.mock("@/lib/issue-labels", () => ({
  getLabelsForIssues: getLabelsForIssuesMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection: Record<string, unknown>) => {
      if ("color" in selection && !("identifier" in selection)) {
        return {
          from: vi.fn().mockReturnValue({
            where: (...whereArgs: unknown[]) => {
              triageStatesWhereMock(...whereArgs);
              return Promise.resolve([
                { id: "state-triage", name: "Triage", color: "#999" },
              ]);
            },
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: issuesOrderByMock,
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

describe("team triage route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    getTeamByKeyMock.mockResolvedValue({
      id: "team-1",
      key: "ENG",
      name: "Engineering",
    });
    issuesOrderByMock.mockResolvedValue([
      {
        id: "issue-1",
        number: 1,
        identifier: "ENG-1",
        title: "Broken triage issue",
        priority: "high",
        stateId: "state-triage",
        stateName: "Triage",
        stateColor: "#999",
        creatorId: "creator-1",
        creatorName: null,
        creatorImage: null,
        createdAt: new Date("2026-04-23T00:00:00.000Z"),
      },
    ]);
    getLabelsForIssuesMock.mockResolvedValue({
      "issue-1": [{ id: "label-1", name: "Bug", color: "#f00" }],
    });
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/triage/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/triage"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when the team is missing", async () => {
    getTeamByKeyMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/triage/route");

    const response = await GET(
      new Request("http://localhost/api/teams/NOPE/triage"),
      {
        params: Promise.resolve({ key: "NOPE" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });

  it("returns empty triage payload when no triage state exists", async () => {
    const { db } = await import("@/lib/db");
    vi.mocked(db.select).mockImplementationOnce(
      () =>
        ({
          from: vi.fn().mockReturnValue({
            where: () => Promise.resolve([]),
          }),
        }) as never,
    );
    const { GET } = await import("@/app/api/teams/[key]/triage/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/triage"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      team: {
        id: "team-1",
        key: "ENG",
        name: "Engineering",
      },
      issues: [],
      count: 0,
      createStateId: null,
      createStateName: null,
    });
  });

  it("returns triage issues with labels and fallback creator names", async () => {
    const { GET } = await import("@/app/api/teams/[key]/triage/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/triage"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      team: {
        id: "team-1",
        key: "ENG",
        name: "Engineering",
      },
      issues: [
        {
          id: "issue-1",
          identifier: "ENG-1",
          title: "Broken triage issue",
          priority: "high",
          stateId: "state-triage",
          stateName: "Triage",
          stateColor: "#999",
          creatorId: "creator-1",
          creatorName: "Unknown",
          creatorImage: null,
          createdAt: "2026-04-23T00:00:00.000Z",
          labelIds: ["label-1"],
          labels: [{ id: "label-1", name: "Bug", color: "#f00" }],
          assigneeId: null,
          projectId: null,
        },
      ],
      count: 1,
      createStateId: "state-triage",
      createStateName: "Triage",
    });
  });
});
