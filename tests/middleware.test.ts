import { describe, expect, it, vi } from "vitest";

// Mock next/server
const mockRedirect = vi.fn(
  (url: URL) =>
    new Response(null, {
      status: 307,
      headers: { Location: url.toString() },
    }),
);
const mockNext = vi.fn(() => new Response(null, { status: 200 }));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: mockRedirect,
    next: mockNext,
  },
}));

function createMockRequest(path: string, cookies: Record<string, string> = {}) {
  const url = new URL(`http://localhost:3000${path}`);
  return {
    nextUrl: {
      pathname: url.pathname,
      search: url.search,
    },
    url: url.toString(),
    cookies: {
      get: (name: string) =>
        cookies[name] ? { value: cookies[name] } : undefined,
    },
  };
}

describe("Auth middleware", () => {
  it("allows /login path without auth", async () => {
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/login");
    await middleware(req as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("allows /signup path without auth", async () => {
    mockNext.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/signup");
    await middleware(req as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("allows /api/auth paths without auth", async () => {
    mockNext.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/api/auth/callback/google");
    await middleware(req as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("allows static assets without auth", async () => {
    mockNext.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/_next/static/chunks/main.js");
    await middleware(req as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("redirects to /login when no session cookie", async () => {
    mockRedirect.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/inbox");
    await middleware(req as never);
    expect(mockRedirect).toHaveBeenCalled();
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/inbox");
  });

  it("redirects unauthenticated users away from /create-workspace", async () => {
    mockRedirect.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/create-workspace");
    await middleware(req as never);
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe(
      "/create-workspace",
    );
  });

  it("redirects unauthenticated users away from /onboarding routes", async () => {
    mockRedirect.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/onboarding/invite");
    await middleware(req as never);
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(redirectUrl.pathname).toBe("/login");
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe(
      "/onboarding/invite",
    );
  });

  it("allows authenticated requests with session cookie", async () => {
    mockNext.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/inbox", {
      "better-auth.session_token": "valid-session-token",
    });
    await middleware(req as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("allows authenticated requests with secure cookie", async () => {
    mockNext.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/team/ENG/all", {
      "__Secure-better-auth.session_token": "valid-session-token",
    });
    await middleware(req as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("preserves callback URL in redirect", async () => {
    mockRedirect.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/team/ENG/board");
    await middleware(req as never);
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe("/team/ENG/board");
  });

  it("preserves query params in callback URL redirects", async () => {
    mockRedirect.mockClear();
    const { middleware } = await import("@/middleware");
    const req = createMockRequest("/accept-invite?token=signed-token");
    await middleware(req as never);
    const redirectUrl = mockRedirect.mock.calls[0][0] as URL;
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe(
      "/accept-invite?token=signed-token",
    );
  });

  it("exports matcher config", async () => {
    const { config } = await import("@/middleware");
    expect(config.matcher).toBeDefined();
    expect(config.matcher.length).toBeGreaterThan(0);
  });
});
