import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const teamLimitMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: teamLimitMock,
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: (...setArgs: unknown[]) => {
        updateSetMock(...setArgs);
        return {
          where: (...whereArgs: unknown[]) => {
            updateWhereMock(...whereArgs);
            return Promise.resolve();
          },
        };
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team display options route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    teamLimitMock.mockResolvedValue([
      {
        id: "team-1",
        settings: {
          displayOptions: {
            layout: "list",
          },
          other: true,
        },
      },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/display-options/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/display-options"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns stored display options", async () => {
    const { GET } = await import("@/app/api/teams/[key]/display-options/route");

    const response = await GET(
      new Request("http://localhost/api/teams/ENG/display-options"),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      displayOptions: {
        layout: "list",
      },
    });
  });

  it("returns 404 when the team does not exist", async () => {
    teamLimitMock.mockResolvedValue([]);
    const { PUT } = await import("@/app/api/teams/[key]/display-options/route");

    const response = await PUT(
      new Request("http://localhost/api/teams/NOPE/display-options", {
        method: "PUT",
        body: JSON.stringify({ displayOptions: { layout: "board" } }),
      }),
      {
        params: Promise.resolve({ key: "NOPE" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });

  it("persists display options without clobbering other settings", async () => {
    const { PUT } = await import("@/app/api/teams/[key]/display-options/route");

    const response = await PUT(
      new Request("http://localhost/api/teams/ENG/display-options", {
        method: "PUT",
        body: JSON.stringify({
          displayOptions: {
            layout: "board",
            groupBy: "status",
          },
        }),
      }),
      {
        params: Promise.resolve({ key: "ENG" }),
      },
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith({
      settings: {
        displayOptions: {
          layout: "board",
          groupBy: "status",
        },
        other: true,
      },
    });
    expect(updateWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      displayOptions: {
        layout: "board",
        groupBy: "status",
      },
    });
  });
});
