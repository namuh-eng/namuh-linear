import { GET, PATCH } from "@/app/api/workspaces/current/ai-settings/route";
import { db } from "@/lib/db";
import { member, user, workspace } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const ADMIN_ID = "22900000-0000-0000-0000-000000000001";
const MEMBER_ID = "22900000-0000-0000-0000-000000000002";
const WS_ID = "22900000-0000-0000-0000-000000000003";
let currentUserId = ADMIN_ID;

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => {
      if (name === "activeWorkspaceId") return { value: WS_ID };
      return undefined;
    }),
  })),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

import { auth } from "@/lib/auth";
const getSessionMock = auth.api.getSession as unknown as ReturnType<
  typeof vi.fn
>;

function mockSession(userId: string) {
  currentUserId = userId;
  getSessionMock.mockResolvedValue({
    session: {
      id: `session-${userId}`,
      userId,
      token: "token",
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    user: {
      id: userId,
      name: userId === ADMIN_ID ? "Admin" : "Member",
      email:
        userId === ADMIN_ID ? "admin-ai@example.com" : "member-ai@example.com",
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function resetData() {
  await db.delete(member).where(eq(member.workspaceId, WS_ID));
  await db.delete(workspace).where(eq(workspace.id, WS_ID));
  await db.delete(user).where(eq(user.id, ADMIN_ID));
  await db.delete(user).where(eq(user.id, MEMBER_ID));

  await db.insert(user).values([
    { id: ADMIN_ID, name: "Admin", email: "admin-ai@example.com" },
    { id: MEMBER_ID, name: "Member", email: "member-ai@example.com" },
  ]);
  await db.insert(workspace).values({
    id: WS_ID,
    name: "AI Settings Workspace",
    urlSlug: "ai-settings-workspace",
    settings: {},
  });
  await db.insert(member).values([
    { workspaceId: WS_ID, userId: ADMIN_ID, role: "admin" },
    { workspaceId: WS_ID, userId: MEMBER_ID, role: "member" },
  ]);
}

describe("workspace AI settings route", () => {
  beforeEach(async () => {
    await resetData();
    mockSession(currentUserId);
  });

  afterAll(async () => {
    await db.delete(member).where(eq(member.workspaceId, WS_ID));
    await db.delete(workspace).where(eq(workspace.id, WS_ID));
    await db.delete(user).where(eq(user.id, ADMIN_ID));
    await db.delete(user).where(eq(user.id, MEMBER_ID));
  });

  it("persists editable workspace AI settings for admins", async () => {
    mockSession(ADMIN_ID);
    const response = await PATCH(
      new Request("http://localhost/api/workspaces/current/ai-settings", {
        method: "PATCH",
        body: JSON.stringify({
          enabled: false,
          usagePermission: "admins",
          agentGuidance: "Always cite workspace policy.",
          issueSuggestions: false,
          summaries: true,
          autoTriage: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.ai.enabled).toBe(false);
    expect(payload.ai.agentGuidance).toBe("Always cite workspace policy.");

    const getResponse = await GET();
    const getPayload = await getResponse.json();
    expect(getPayload.ai).toMatchObject({
      enabled: false,
      usagePermission: "admins",
      agentGuidance: "Always cite workspace policy.",
      issueSuggestions: false,
      autoTriage: true,
    });
  });

  it("rejects non-admin mutations", async () => {
    mockSession(MEMBER_ID);
    const response = await PATCH(
      new Request("http://localhost/api/workspaces/current/ai-settings", {
        method: "PATCH",
        body: JSON.stringify({ enabled: false }),
      }),
    );

    expect(response.status).toBe(403);
  });
});
