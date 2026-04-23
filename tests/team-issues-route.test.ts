import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const getTeamByKeyMock = vi.fn();
const statesOrderByMock = vi.fn();
const issuesOrderByMock = vi.fn();
const creatorsWhereMock = vi.fn();
const cyclesWhereMock = vi.fn();
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
    select: vi.fn((selection?: Record<string, unknown>) => {
      if (!selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: statesOrderByMock,
            }),
          }),
        };
      }

      if ("identifier" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: issuesOrderByMock,
                }),
              }),
            }),
          }),
        };
      }

      if ("name" in selection && Object.keys(selection).length === 2) {
        return {
          from: vi.fn().mockReturnValue({
            where: (...whereArgs: unknown[]) => {
              creatorsWhereMock(...whereArgs);
              return Promise.resolve([{ id: "creator-1", name: "Bob" }]);
            },
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: (...whereArgs: unknown[]) => {
            cyclesWhereMock(...whereArgs);
            return Promise.resolve([
              { id: "cycle-1", name: "Cycle Alpha", number: 1 },
            ]);
          },
        }),
      };
    }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team issues route", () => {
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
    statesOrderByMock.mockResolvedValue([
      {
        id: "state-1",
        name: "Backlog",
        category: "backlog",
        color: "#999",
        position: 1,
      },
      {
        id: "state-2",
        name: "Done",
        category: "completed",
        color: "#0f0",
        position: 2,
      },
    ]);
    issuesOrderByMock.mockResolvedValue([
      {
        id: "issue-1",
        number: 1,
        identifier: "ENG-1",
        title: "First issue",
        priority: "high",
        stateId: "state-2",
        assigneeId: "user-2",
        creatorId: "creator-1",
        assigneeName: "Alice",
        assigneeImage: null,
        projectId: "project-1",
        projectName: "Platform",
        cycleId: "cycle-1",
        estimate: 3,
        dueDate: new Date("2026-04-10T00:00:00.000Z"),
        createdAt: new Date("2026-04-02T00:00:00.000Z"),
        sortOrder: 1,
      },
    ]);
    getLabelsForIssuesMock.mockResolvedValue({
      "issue-1": [{ id: "label-1", name: "Bug", color: "#f00" }],
    });
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/issues/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/issues"),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when the team is missing", async () => {
    getTeamByKeyMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/issues/route");

    const response = await GET(
      new Request("http://localhost/api/teams/NOPE/issues"),
      { params: Promise.resolve({ key: "NOPE" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });

  it("returns grouped issues with filter options", async () => {
    const { GET } = await import("@/app/api/teams/[key]/issues/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/issues"),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      team: {
        id: "team-1",
        name: "Engineering",
        key: "ENG",
      },
      groups: [
        {
          state: {
            id: "state-1",
            name: "Backlog",
            category: "backlog",
            color: "#999",
            position: 1,
          },
          issues: [],
        },
        {
          state: {
            id: "state-2",
            name: "Done",
            category: "completed",
            color: "#0f0",
            position: 2,
          },
          issues: [
            {
              id: "issue-1",
              number: 1,
              identifier: "ENG-1",
              title: "First issue",
              priority: "high",
              stateId: "state-2",
              assigneeId: "user-2",
              assignee: { name: "Alice", image: null },
              creatorId: "creator-1",
              creatorName: "Bob",
              labels: [{ id: "label-1", name: "Bug", color: "#f00" }],
              labelIds: ["Bug"],
              projectId: "project-1",
              projectName: "Platform",
              cycleId: "cycle-1",
              cycleName: "Cycle Alpha",
              estimate: 3,
              dueDate: "2026-04-10T00:00:00.000Z",
              createdAt: "2026-04-02T00:00:00.000Z",
            },
          ],
        },
      ],
      filterOptions: {
        statuses: [
          {
            id: "state-1",
            name: "Backlog",
            category: "backlog",
            color: "#999",
          },
          { id: "state-2", name: "Done", category: "completed", color: "#0f0" },
        ],
        assignees: [{ id: "user-2", name: "Alice", image: null }],
        labels: [{ id: "Bug", name: "Bug", color: "#f00" }],
        projects: [{ id: "project-1", name: "Platform" }],
        creators: [{ id: "creator-1", name: "Bob" }],
        cycles: [{ id: "cycle-1", name: "Cycle Alpha" }],
        estimates: [{ value: "3", label: "3" }],
        dueDates: [{ value: "2026-04-10", label: "Apr 10" }],
        priorities: [
          { value: "urgent", label: "Urgent" },
          { value: "high", label: "High" },
          { value: "medium", label: "Medium" },
          { value: "low", label: "Low" },
          { value: "none", label: "No priority" },
        ],
      },
    });
  });
});
