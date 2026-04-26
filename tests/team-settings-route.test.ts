import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findAccessibleTeamMock = vi.fn();
const countWhereMock = vi.fn();
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
  findAccessibleTeam: findAccessibleTeamMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn((selection: Record<string, unknown>) => {
      // count queries in buildTeamResponse
      if (selection && "value" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(countWhereMock()),
          }),
        };
      }

      // duplicate key check in PATCH
      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      };
    }),
    update: vi.fn(() => ({
      set: (...setArgs: unknown[]) => {
        updateSetMock(...setArgs);
        return {
          where: (...whereArgs: unknown[]) => {
            updateWhereMock(...whereArgs);
            return {
              returning: vi
                .fn()
                .mockResolvedValue([
                  { id: "team-1", workspaceId: "workspace-1" },
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

describe("team settings route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findAccessibleTeamMock.mockResolvedValue({
      id: "team-1",
      name: "Engineering",
      key: "ENG",
      icon: "rocket",
      settings: { emailEnabled: true },
      estimateType: "linear",
    });
    countWhereMock.mockReturnValue([{ value: 5 }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/settings/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "ENG" }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 404 when team is not found", async () => {
    findAccessibleTeamMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/teams/[key]/settings/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "MISSING" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns full team settings payload", async () => {
    const { GET } = await import("@/app/api/teams/[key]/settings/route");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "ENG" }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.team.id).toBe("team-1");
    expect(payload.team.emailEnabled).toBe(true);
    expect(payload.team.memberCount).toBe(5);
  });

  it("updates team settings", async () => {
    const { PATCH } = await import("@/app/api/teams/[key]/settings/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Core",
          key: "CORE",
          triageEnabled: false,
        }),
      }),
      { params: Promise.resolve({ key: "ENG" }) },
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Core",
        key: "CORE",
      }),
    );
  });
});
