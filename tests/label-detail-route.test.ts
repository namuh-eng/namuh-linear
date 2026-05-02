import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const findAuthorizedLabelRefMock = vi.fn();
const updateReturningMock = vi.fn();
const deleteReturningMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("@/lib/api-authz", () => ({
  findAuthorizedLabelRef: findAuthorizedLabelRefMock,
}));

vi.mock("@/lib/db", () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(updateReturningMock()),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(deleteReturningMock()),
      }),
    })),
  },
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

describe("label detail route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findAuthorizedLabelRefMock.mockResolvedValue({
      id: "label-1",
      workspaceId: "ws-1",
      teamId: null,
    });
    updateReturningMock.mockReturnValue([{ id: "label-1", name: "Bug" }]);
    deleteReturningMock.mockReturnValue([{ id: "label-1" }]);
  });

  it("patches labels only inside the active workspace", async () => {
    const { PATCH } = await import("@/app/api/labels/[id]/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "Bug" }),
      }),
      { params: Promise.resolve({ id: "label-1" }) },
    );

    expect(response.status).toBe(200);
    expect(findAuthorizedLabelRefMock).toHaveBeenCalledWith(
      "label-1",
      "user-1",
    );
  });

  it("returns 404 for labels outside the active workspace", async () => {
    findAuthorizedLabelRefMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/labels/[id]/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "Bug" }),
      }),
      { params: Promise.resolve({ id: "foreign-label" }) },
    );

    expect(response.status).toBe(404);
  });

  it("deletes labels only inside the active workspace", async () => {
    const { DELETE } = await import("@/app/api/labels/[id]/route");

    const response = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: "label-1" }),
    });

    expect(response.status).toBe(200);
  });
});
