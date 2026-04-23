import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const teamContextLimitMock = vi.fn();
const statusesOrderByMock = vi.fn();
const assigneesOrderByMock = vi.fn();
const labelsOrderByMock = vi.fn();
const projectsOrderByMock = vi.fn();

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
      if (
        "workspaceId" in selection &&
        "name" in selection &&
        "key" in selection
      ) {
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: teamContextLimitMock,
              }),
            }),
          }),
        };
      }

      if ("category" in selection && "color" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: statusesOrderByMock,
            }),
          }),
        };
      }

      if ("image" in selection && Object.keys(selection).length === 3) {
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: assigneesOrderByMock,
              }),
            }),
          }),
        };
      }

      if ("color" in selection && Object.keys(selection).length === 3) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: labelsOrderByMock,
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: projectsOrderByMock,
          }),
        }),
      };
    }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team create issue options route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: {
        id: "user-1",
        name: "Fallback User",
        email: "fallback@example.com",
        image: null,
      },
    });
    teamContextLimitMock.mockResolvedValue([
      {
        id: "team-1",
        name: "Engineering",
        key: "ENG",
        workspaceId: "workspace-1",
      },
    ]);
    statusesOrderByMock.mockResolvedValue([
      {
        id: "state-1",
        name: "Backlog",
        category: "backlog",
        color: "#999",
      },
    ]);
    assigneesOrderByMock.mockResolvedValue([
      {
        id: "user-2",
        name: "Alice",
        image: "https://example.com/alice.png",
      },
    ]);
    labelsOrderByMock.mockResolvedValue([
      {
        id: "label-1",
        name: "Bug",
        color: "#f00",
      },
    ]);
    projectsOrderByMock.mockResolvedValue([
      {
        id: "project-1",
        name: "API hardening",
        icon: "🔧",
      },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import(
      "@/app/api/teams/[key]/create-issue-options/route"
    );

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/create-issue-options"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when the team is missing", async () => {
    teamContextLimitMock.mockResolvedValue([]);
    const { GET } = await import(
      "@/app/api/teams/[key]/create-issue-options/route"
    );

    const response = await GET(
      new Request("http://localhost/api/teams/NOPE/create-issue-options"),
      {
        params: Promise.resolve({ key: "NOPE" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });

  it("returns issue creation metadata for the team", async () => {
    const { GET } = await import(
      "@/app/api/teams/[key]/create-issue-options/route"
    );

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/create-issue-options"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      team: {
        id: "team-1",
        name: "Engineering",
        key: "ENG",
      },
      statuses: [
        {
          id: "state-1",
          name: "Backlog",
          category: "backlog",
          color: "#999",
        },
      ],
      priorities: [
        { value: "urgent", label: "Urgent" },
        { value: "high", label: "High" },
        { value: "medium", label: "Medium" },
        { value: "low", label: "Low" },
        { value: "none", label: "No priority" },
      ],
      assignees: [
        {
          id: "user-2",
          name: "Alice",
          image: "https://example.com/alice.png",
        },
      ],
      labels: [
        {
          id: "label-1",
          name: "Bug",
          color: "#f00",
        },
      ],
      projects: [
        {
          id: "project-1",
          name: "API hardening",
          icon: "🔧",
        },
      ],
    });
  });

  it("falls back to the current session user when no assignees exist", async () => {
    assigneesOrderByMock.mockResolvedValue([]);
    const { GET } = await import(
      "@/app/api/teams/[key]/create-issue-options/route"
    );

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/create-issue-options"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      assignees: [
        {
          id: "user-1",
          name: "Fallback User",
          image: null,
        },
      ],
    });
  });
});
