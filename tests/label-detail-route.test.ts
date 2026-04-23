import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const membershipsLimitMock = vi.fn();
const updateSetMock = vi.fn();
const updateWhereMock = vi.fn();
const updateReturningMock = vi.fn();
const deleteWhereMock = vi.fn();
const deleteReturningMock = vi.fn();

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
          limit: membershipsLimitMock,
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
              returning: updateReturningMock,
            };
          },
        };
      },
    })),
    delete: vi.fn(() => ({
      where: (...whereArgs: unknown[]) => {
        deleteWhereMock(...whereArgs);
        return {
          returning: deleteReturningMock,
        };
      },
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
    membershipsLimitMock.mockResolvedValue([{ workspaceId: "workspace-1" }]);
    updateReturningMock.mockResolvedValue([
      {
        id: "label-1",
        workspaceId: "workspace-1",
        name: "Bug",
        color: "#f00",
        description: "Broken things",
      },
    ]);
    deleteReturningMock.mockResolvedValue([{ id: "label-1" }]);
  });

  it("returns 401 without a session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { PATCH } = await import("@/app/api/labels/[id]/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "Bug" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: "label-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when the user has no workspace on patch", async () => {
    membershipsLimitMock.mockResolvedValue([]);
    const { PATCH } = await import("@/app/api/labels/[id]/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "Bug" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: "label-1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "No workspace" });
  });

  it("updates a label inside the active workspace", async () => {
    const { PATCH } = await import("@/app/api/labels/[id]/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Bug",
          color: "#f00",
          description: "Broken things",
        }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: "label-1" }) },
    );

    expect(response.status).toBe(200);
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Bug",
        color: "#f00",
        description: "Broken things",
        updatedAt: expect.any(Date),
      }),
    );
    expect(updateWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      label: {
        id: "label-1",
        workspaceId: "workspace-1",
        name: "Bug",
        color: "#f00",
        description: "Broken things",
      },
    });
  });

  it("returns 404 when the label is missing on patch", async () => {
    updateReturningMock.mockResolvedValue([]);
    const { PATCH } = await import("@/app/api/labels/[id]/route");

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ name: "Bug" }),
        headers: { "content-type": "application/json" },
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Label not found",
    });
  });

  it("returns 404 when the user has no workspace on delete", async () => {
    membershipsLimitMock.mockResolvedValue([]);
    const { DELETE } = await import("@/app/api/labels/[id]/route");

    const response = await DELETE({} as never, {
      params: Promise.resolve({ id: "label-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "No workspace" });
  });

  it("deletes a label inside the active workspace", async () => {
    const { DELETE } = await import("@/app/api/labels/[id]/route");

    const response = await DELETE({} as never, {
      params: Promise.resolve({ id: "label-1" }),
    });

    expect(response.status).toBe(200);
    expect(deleteWhereMock).toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns 404 when the label is missing on delete", async () => {
    deleteReturningMock.mockResolvedValue([]);
    const { DELETE } = await import("@/app/api/labels/[id]/route");

    const response = await DELETE({} as never, {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Label not found",
    });
  });
});
