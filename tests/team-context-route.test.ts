import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const contextLimitMock = vi.fn();
const teamsWhereMock = vi.fn();

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
      if ("workspaceName" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              innerJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: contextLimitMock,
                }),
              }),
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: (...whereArgs: unknown[]) => {
            teamsWhereMock(...whereArgs);
            return Promise.resolve([
              { id: "team-1", name: "Engineering", key: "ENG" },
              { id: "team-2", name: "Support", key: "SUP" },
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

describe("team context route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    contextLimitMock.mockResolvedValue([
      {
        workspaceName: "Acme Workspace",
        workspaceId: "workspace-1",
        teamId: "team-1",
        teamName: "Engineering",
        teamKey: "ENG",
      },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/context/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/context"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns workspace and sibling team context for the active member", async () => {
    const { GET } = await import("@/app/api/teams/[key]/context/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/context"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      workspaceName: "Acme Workspace",
      workspaceId: "workspace-1",
      teamId: "team-1",
      teamName: "Engineering",
      teamKey: "ENG",
      workspaceInitials: "AC",
      teams: [
        { id: "team-1", name: "Engineering", key: "ENG" },
        { id: "team-2", name: "Support", key: "SUP" },
      ],
    });
    expect(teamsWhereMock).toHaveBeenCalled();
  });

  it("returns 404 when the team is not accessible", async () => {
    contextLimitMock.mockResolvedValue([]);
    const { GET } = await import("@/app/api/teams/[key]/context/route");

    const response = await GET(
      new Request("http://localhost/api/teams/NOPE/context"),
      {
        params: Promise.resolve({ key: "NOPE" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });
});
