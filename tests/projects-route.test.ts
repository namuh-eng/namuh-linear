import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const projectsOrderByMock = vi.fn();
const issueCountsGroupByMock = vi.fn();
const projectTeamRowsInArrayMock = vi.fn();
const insertReturningMock = vi.fn();
const teamLimitMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/active-workspace", () => ({
  resolveActiveWorkspaceId: resolveActiveWorkspaceIdMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection?: Record<string, unknown>) => {
      // resolveActiveWorkspaceId / memberships (already mocked in lib)

      // projects lookup
      if (selection && "slug" in selection && "leadId" in selection) {
        return {
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue(projectsOrderByMock()),
        };
      }

      // issueCounts lookup
      if (selection && "total" in selection && "completed" in selection) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          groupBy: vi.fn().mockResolvedValue(issueCountsGroupByMock()),
        };
      }

      // projectTeamRows lookup
      if (selection && "projectId" in selection && "teamId" in selection) {
        return {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockResolvedValue(projectTeamRowsInArrayMock()),
        };
      }

      // team lookup for slug generation/POST
      if (
        selection &&
        "key" in selection &&
        Object.keys(selection).length === 2
      ) {
        return {
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue(teamLimitMock()),
        };
      }

      // used for slug availability check
      if (
        selection &&
        "slug" in selection &&
        Object.keys(selection).length === 1
      ) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
    }),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(insertReturningMock()),
      }),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("projects collection route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-1");
    projectsOrderByMock.mockReturnValue([
      {
        id: "proj-1",
        name: "Ever",
        slug: "ever",
        status: "started",
        priority: "high",
        leadName: "Ashley",
        leadImage: null,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ]);
    issueCountsGroupByMock.mockReturnValue([
      { projectId: "proj-1", total: 10, completed: 3 },
    ]);
    projectTeamRowsInArrayMock.mockReturnValue([
      {
        projectId: "proj-1",
        teamId: "team-1",
        teamKey: "ENG",
        teamName: "Engineering",
      },
    ]);
    teamLimitMock.mockReturnValue([{ id: "team-1", key: "ENG" }]);
    insertReturningMock.mockReturnValue([{ id: "proj-2", slug: "new-proj" }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/projects/route");

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns serialized projects with progress and teams", async () => {
    const { GET } = await import("@/app/api/projects/route");

    const response = await GET();

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.projects[0].id).toBe("proj-1");
    expect(payload.projects[0].progress).toBe(30);
    expect(payload.projects[0].teams.length).toBe(1);
  });

  it("creates a project", async () => {
    const { POST } = await import("@/app/api/projects/route");

    const response = await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "New Project", teamIds: ["team-1"] }),
      }),
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.id).toBe("proj-2");
  });
});
