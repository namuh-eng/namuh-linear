import { afterEach, describe, expect, it, vi } from "vitest";

const currentUserId = "issue-35-user";
const currentSessionId = "issue-35-current-session";
const otherSessionId = "issue-35-other-session";

const mocks = vi.hoisted(() => ({
  requireApiSession: vi.fn(),
  dbSelect: vi.fn(),
  currentUserRows: [{ id: "issue-35-user" }],
  sessionRows: [
    {
      id: "issue-35-current-session",
      userAgent: "Mozilla/5.0 Current Browser",
      ipAddress: "203.0.113.10",
      createdAt: new Date("2026-01-01T10:00:00.000Z"),
      updatedAt: new Date("2026-01-02T10:00:00.000Z"),
      expiresAt: new Date("2026-02-01T10:00:00.000Z"),
    },
    {
      id: "issue-35-other-session",
      userAgent: "Mozilla/5.0 Other Browser",
      ipAddress: "203.0.113.11",
      createdAt: new Date("2026-01-03T10:00:00.000Z"),
      updatedAt: new Date("2026-01-04T10:00:00.000Z"),
      expiresAt: new Date("2026-02-03T10:00:00.000Z"),
    },
  ],
  providerRows: [
    {
      id: "issue-35-google-account",
      providerId: "google",
      accountId: "google-user-123",
      createdAt: new Date("2026-01-05T10:00:00.000Z"),
      updatedAt: new Date("2026-01-06T10:00:00.000Z"),
    },
  ],
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiSession: mocks.requireApiSession,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: mocks.dbSelect,
  },
}));

function createQueryBuilder(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(rows),
    orderBy: vi.fn().mockResolvedValue(rows),
  };
}

function setupDbMock() {
  const selectedShapes: string[][] = [];

  mocks.dbSelect.mockImplementation((shape: Record<string, unknown>) => {
    const keys = Object.keys(shape);
    selectedShapes.push(keys);

    if (keys.includes("providerId")) {
      return createQueryBuilder(mocks.providerRows);
    }

    if (keys.includes("userAgent")) {
      return createQueryBuilder(mocks.sessionRows);
    }

    return createQueryBuilder(mocks.currentUserRows);
  });

  return selectedShapes;
}

describe("Account Security API Route", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mocks.currentUserRows = [{ id: currentUserId }];
  });

  it("returns 401 if no session", async () => {
    const unauthorized = Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    mocks.requireApiSession.mockResolvedValue({
      response: unauthorized,
      session: null,
    });

    const { GET } = await import("@/app/api/account/security/route");
    const res = await GET();

    expect(res.status).toBe(401);
    expect(mocks.dbSelect).not.toHaveBeenCalled();
  });

  it("returns safe sessions and providers for the current user", async () => {
    const selectedShapes = setupDbMock();
    mocks.requireApiSession.mockResolvedValue({
      response: null,
      session: {
        user: { id: currentUserId },
        session: { id: currentSessionId },
      },
    });

    const { GET } = await import("@/app/api/account/security/route");
    const res = await GET();
    const data = await res.json();
    const serialized = JSON.stringify(data);

    expect(res.status).toBe(200);
    expect(data.sessions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: currentSessionId,
          isCurrent: true,
          userAgent: "Mozilla/5.0 Current Browser",
          ipAddress: "203.0.113.10",
          createdAt: "2026-01-01T10:00:00.000Z",
          updatedAt: "2026-01-02T10:00:00.000Z",
          expiresAt: "2026-02-01T10:00:00.000Z",
        }),
        expect.objectContaining({
          id: otherSessionId,
          isCurrent: false,
        }),
      ]),
    );
    expect(data.providers).toEqual([
      expect.objectContaining({
        id: "issue-35-google-account",
        providerId: "google",
        accountId: "google-user-123",
        createdAt: "2026-01-05T10:00:00.000Z",
        updatedAt: "2026-01-06T10:00:00.000Z",
      }),
    ]);

    const flattenedSelectedFields = selectedShapes.flat();
    expect(flattenedSelectedFields).not.toEqual(
      expect.arrayContaining([
        "token",
        "accessToken",
        "refreshToken",
        "idToken",
        "password",
        "accessTokenExpiresAt",
        "refreshTokenExpiresAt",
        "scope",
      ]),
    );
    expect(serialized).not.toMatch(/token|password|secret/i);
    expect(data.sessions[0]).not.toHaveProperty("token");
    expect(data.providers[0]).not.toHaveProperty("accessToken");
    expect(data.providers[0]).not.toHaveProperty("refreshToken");
    expect(data.providers[0]).not.toHaveProperty("idToken");
    expect(data.providers[0]).not.toHaveProperty("password");
  });

  it("returns empty safe lists when the account has no sessions or providers", async () => {
    mocks.sessionRows = [];
    mocks.providerRows = [];
    setupDbMock();
    mocks.requireApiSession.mockResolvedValue({
      response: null,
      session: {
        user: { id: currentUserId },
        session: { id: currentSessionId },
      },
    });

    const { GET } = await import("@/app/api/account/security/route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ sessions: [], providers: [] });
  });
});
