import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const getTeamIdByKeyMock = vi.fn();
const workflowOrderByMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();

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
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: workflowOrderByMock,
          }),
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: (...setArgs: unknown[]) => {
        updateSetMock(...setArgs);
        return {
          where: (...whereArgs: unknown[]) => {
            updateWhereMock(...whereArgs);
            return {
              returning: vi.fn().mockResolvedValue([
                {
                  id: "issue-1",
                  stateId: "state-backlog",
                },
              ]),
            };
          },
        };
      },
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("team triage issue route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    getTeamIdByKeyMock.mockResolvedValue("team-1");
    workflowOrderByMock.mockResolvedValue([{ id: "state-backlog" }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { PATCH } = await import(
      "@/app/api/teams/[key]/triage/[issueId]/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/teams/ENG/triage/issue-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      }),
      {
        params: Promise.resolve({ key: "ENG", issueId: "issue-1" }),
      },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when the team does not exist", async () => {
    getTeamIdByKeyMock.mockResolvedValue(null);
    const { PATCH } = await import(
      "@/app/api/teams/[key]/triage/[issueId]/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/teams/ENG/triage/issue-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      }),
      {
        params: Promise.resolve({ key: "ENG", issueId: "issue-1" }),
      },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Team not found" });
  });

  it("accepts a triage issue into the first backlog state", async () => {
    const { PATCH } = await import(
      "@/app/api/teams/[key]/triage/[issueId]/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/teams/ENG/triage/issue-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      }),
      {
        params: Promise.resolve({ key: "ENG", issueId: "issue-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stateId: "state-backlog",
        updatedAt: expect.any(Date),
      }),
    );
    expect(updateWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      id: "issue-1",
      stateId: "state-backlog",
    });
  });

  it("rejects accept when no backlog state exists", async () => {
    workflowOrderByMock.mockResolvedValue([]);
    const { PATCH } = await import(
      "@/app/api/teams/[key]/triage/[issueId]/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/teams/ENG/triage/issue-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "accept" }),
      }),
      {
        params: Promise.resolve({ key: "ENG", issueId: "issue-1" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No backlog state found",
    });
  });

  it("declines a triage issue into the first canceled state", async () => {
    workflowOrderByMock.mockResolvedValue([{ id: "state-canceled" }]);
    const { PATCH } = await import(
      "@/app/api/teams/[key]/triage/[issueId]/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/teams/ENG/triage/issue-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "decline" }),
      }),
      {
        params: Promise.resolve({ key: "ENG", issueId: "issue-1" }),
      },
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        stateId: "state-canceled",
        canceledAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("rejects invalid actions", async () => {
    const { PATCH } = await import(
      "@/app/api/teams/[key]/triage/[issueId]/route"
    );

    const response = await PATCH(
      new Request("http://localhost/api/teams/ENG/triage/issue-1", {
        method: "PATCH",
        body: JSON.stringify({ action: "archive" }),
      }),
      {
        params: Promise.resolve({ key: "ENG", issueId: "issue-1" }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid action" });
  });
});
