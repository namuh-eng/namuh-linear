import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const membershipsLimitMock = vi.fn();
const initiativesWhereMock = vi.fn();
const projectsInnerJoinMock = vi.fn();
const insertReturningMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection?: Record<string, unknown>) => {
      if (selection && "workspaceId" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: membershipsLimitMock,
              }),
            }),
          }),
        };
      }

      if (selection && "id" in selection && "status" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            innerJoin: vi.fn().mockReturnValue({
              where: projectsInnerJoinMock,
            }),
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: initiativesWhereMock,
        }),
      };
    }),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: insertReturningMock,
      }),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({
    get: vi.fn(),
  }),
}));

describe("initiatives collection route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipsLimitMock.mockResolvedValue([{ workspaceId: "workspace-1" }]);
    initiativesWhereMock.mockResolvedValue([
      {
        id: "init-1",
        name: "Growth",
        description: "Scale things",
        status: "active",
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ]);
    projectsInnerJoinMock.mockResolvedValue([
      { id: "proj-1", name: "Referrals", status: "completed", icon: "rocket" },
      { id: "proj-2", name: "Ads", status: "active", icon: "ads" },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/initiatives/route");

    const response = await GET(new Request("http://localhost/api/initiatives"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when the user has no workspace", async () => {
    membershipsLimitMock.mockResolvedValue([]);
    const { GET } = await import("@/app/api/initiatives/route");

    const response = await GET(new Request("http://localhost/api/initiatives"));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "No workspace" });
  });

  it("returns initiatives with project counts", async () => {
    const { GET } = await import("@/app/api/initiatives/route");

    const response = await GET(new Request("http://localhost/api/initiatives"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      initiatives: [
        {
          id: "init-1",
          name: "Growth",
          description: "Scale things",
          status: "active",
          projectCount: 2,
          completedProjectCount: 1,
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("rejects creation with missing name", async () => {
    const { POST } = await import("@/app/api/initiatives/route");

    const response = await POST(
      new Request("http://localhost/api/initiatives", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Initiative name is required",
    });
  });

  it("creates an initiative", async () => {
    insertReturningMock.mockResolvedValue([
      {
        id: "init-2",
        name: "New Initiative",
        description: "Detail",
        status: "planned",
        createdAt: new Date("2026-04-26T00:00:00.000Z"),
        updatedAt: new Date("2026-04-26T00:00:00.000Z"),
      },
    ]);
    const { POST } = await import("@/app/api/initiatives/route");

    const response = await POST(
      new Request("http://localhost/api/initiatives", {
        method: "POST",
        body: JSON.stringify({ name: "New Initiative", description: "Detail" }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "init-2",
      name: "New Initiative",
      description: "Detail",
      status: "planned",
      createdAt: "2026-04-26T00:00:00.000Z",
      updatedAt: "2026-04-26T00:00:00.000Z",
    });
  });
});
