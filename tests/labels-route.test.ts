import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const membershipsLimitMock = vi.fn();
const labelsOrderByMock = vi.fn();
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
      // resolveWorkspaceId lookup
      if (selection && "workspaceId" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: membershipsLimitMock,
            }),
          }),
        };
      }

      // GET labels with issueCount
      if (selection && "issueCount" in selection) {
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                groupBy: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue(labelsOrderByMock()),
                }),
              }),
            }),
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

describe("labels collection route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    membershipsLimitMock.mockResolvedValue([{ workspaceId: "workspace-1" }]);
    labelsOrderByMock.mockReturnValue([
      {
        id: "label-1",
        name: "Bug",
        color: "#f00",
        description: "Bugs",
        issueCount: 2,
        createdAt: new Date("2026-04-01T00:00:00.000Z"),
        updatedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    ]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { GET } = await import("@/app/api/labels/route");

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns workspace labels", async () => {
    const { GET } = await import("@/app/api/labels/route");

    const response = await GET();

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.labels.length).toBe(1);
    expect(payload.labels[0].name).toBe("Bug");
  });

  it("creates a label", async () => {
    insertReturningMock.mockReturnValue([{ id: "label-2", name: "Feature" }]);
    const { POST } = await import("@/app/api/labels/route");

    const response = await POST(
      new Request("http://localhost/api/labels", {
        method: "POST",
        body: JSON.stringify({ name: "Feature", color: "#0f0" }),
      }),
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.label.id).toBe("label-2");
  });
});
