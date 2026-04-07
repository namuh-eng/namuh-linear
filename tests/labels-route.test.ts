import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const membershipLimitMock = vi.fn();
const labelsOrderByMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi
      .fn()
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: membershipLimitMock,
          }),
        }),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockReturnValue({
                orderBy: labelsOrderByMock,
              }),
            }),
          }),
        }),
      })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("labels route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({
      user: { id: "user-1" },
    });
    membershipLimitMock.mockResolvedValue([{ workspaceId: "workspace-1" }]);
  });

  it("returns workspace labels and uses updatedAt as the last-applied fallback", async () => {
    labelsOrderByMock.mockResolvedValue([
      {
        id: "label-1",
        name: "bug",
        color: "#e5484d",
        description: "Something broke",
        parentLabelId: null,
        createdAt: new Date("2025-04-01T00:00:00.000Z"),
        updatedAt: new Date("2025-04-12T00:00:00.000Z"),
        issueCount: 3,
      },
      {
        id: "label-2",
        name: "frontend",
        color: "#3b82f6",
        description: null,
        parentLabelId: null,
        createdAt: new Date("2025-09-01T00:00:00.000Z"),
        updatedAt: new Date("2025-09-04T00:00:00.000Z"),
        issueCount: 0,
      },
    ]);

    const { GET } = await import("@/app/api/labels/route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      labels: [
        {
          id: "label-1",
          name: "bug",
          color: "#e5484d",
          description: "Something broke",
          parentLabelId: null,
          issueCount: 3,
          lastApplied: "2025-04-12T00:00:00.000Z",
          createdAt: "2025-04-01T00:00:00.000Z",
        },
        {
          id: "label-2",
          name: "frontend",
          color: "#3b82f6",
          description: null,
          parentLabelId: null,
          issueCount: 0,
          lastApplied: null,
          createdAt: "2025-09-01T00:00:00.000Z",
        },
      ],
    });
  });
});
