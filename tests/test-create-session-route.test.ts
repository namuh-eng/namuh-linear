import { beforeEach, describe, expect, it, vi } from "vitest";

const userLimitMock = vi.fn();
const insertReturningMock = vi.fn();
const createSessionMock = vi.fn();
const makeSignatureMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: {
    $context: Promise.resolve({
      internalAdapter: {
        createSession: (userId: string) => createSessionMock(userId),
      },
      secret: "test-secret",
      authCookies: {
        sessionToken: {
          name: "better-auth.session-token",
          attributes: { httpOnly: true, path: "/", sameSite: "lax" },
        },
      },
    }),
  },
}));

vi.mock("better-auth/crypto", () => ({
  makeSignature: (token: string, secret: string) =>
    makeSignatureMock(token, secret),
}));

vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(userLimitMock()),
        }),
      }),
    })),
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

describe("test create session route", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    userLimitMock.mockReturnValue([
      { id: "user-1", email: "test@test.com", name: "Test User" },
    ]);
    createSessionMock.mockResolvedValue({
      token: "session-token",
      expiresAt: new Date(Date.now() + 3600000),
    });
    makeSignatureMock.mockResolvedValue("signature");
  });

  it("returns 200 and session when in test mode", async () => {
    const { POST } = await import("@/app/api/test/create-session/route");

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com" }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.success).toBe(true);
    expect(payload.sessionToken).toBe("session-token.signature");
  });
});
