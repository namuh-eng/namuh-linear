import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const resolveActiveWorkspaceIdMock = vi.fn();
const memberLimitMock = vi.fn();
const teamLimitMock = vi.fn();
const countWhereMock = vi.fn();
const teamWhereMock = vi.fn();

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
    select: vi.fn((selection: Record<string, unknown>) => {
      if ("value" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: (...args: unknown[]) => {
              countWhereMock(...args);
              return Promise.resolve([{ value: 0 }]);
            },
          }),
        };
      }

      if (
        "workspaceId" in selection &&
        "timezone" in selection &&
        "settings" in selection
      ) {
        return {
          from: vi.fn().mockReturnValue({
            where: (...args: unknown[]) => {
              teamWhereMock(...args);
              return {
                limit: teamLimitMock,
              };
            },
          }),
        };
      }

      return {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: memberLimitMock,
          }),
        }),
      };
    }),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

function collectParamValues(sql: unknown): unknown[] {
  if (!sql || typeof sql !== "object") {
    return [];
  }

  const maybeSql = sql as { queryChunks?: unknown[]; value?: unknown };
  if ("value" in maybeSql && !("queryChunks" in maybeSql)) {
    return [maybeSql.value];
  }

  if (!Array.isArray(maybeSql.queryChunks)) {
    return [];
  }

  return maybeSql.queryChunks.flatMap((chunk) => collectParamValues(chunk));
}

describe("team settings route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    resolveActiveWorkspaceIdMock.mockResolvedValue("workspace-2");
    memberLimitMock.mockResolvedValue([{ id: "member-1" }]);
    teamLimitMock.mockResolvedValue([
      {
        id: "team-2",
        workspaceId: "workspace-2",
        name: "Scoped Team",
        key: "QAX",
        icon: "•",
        timezone: "America/Los_Angeles",
        estimateType: "not_in_use",
        triageEnabled: true,
        cyclesEnabled: false,
        cycleStartDay: null,
        cycleDurationWeeks: null,
        settings: {},
      },
    ]);
  });

  it("scopes team lookup to the active workspace", async () => {
    const { GET } = await import("@/app/api/teams/[key]/settings/route");
    const response = await GET(
      new Request("http://localhost/api/teams/QAX/settings"),
      {
        params: Promise.resolve({ key: "QAX" }),
      },
    );

    expect(response.status).toBe(200);
    const whereExpression = teamWhereMock.mock.calls[0]?.[0];
    expect(collectParamValues(whereExpression)).toEqual(
      expect.arrayContaining(["QAX", "workspace-2"]),
    );
    await expect(response.json()).resolves.toEqual({
      team: expect.objectContaining({
        id: "team-2",
        key: "QAX",
        name: "Scoped Team",
      }),
    });
  });
});
