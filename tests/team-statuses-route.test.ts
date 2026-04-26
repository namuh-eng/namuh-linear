import { GET } from "@/app/api/teams/[key]/statuses/route";
import { db } from "@/lib/db";
import { team, workflowState, user, workspace, member } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_WS_ID = "00000000-0000-0000-0000-000000000002";
const TEST_TEAM_ID = "00000000-0000-0000-0000-000000000003";

const TEST_STATE_ID = "00000000-0000-0000-0000-000000000004";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
  })),
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";

describe("Team Statuses API Route", () => {
  beforeAll(async () => {
    // Cleanup
    await db.delete(workflowState).where(eq(workflowState.teamId, TEST_TEAM_ID));
    await db.delete(team).where(eq(team.id, TEST_TEAM_ID));
    await db.delete(member).where(eq(member.userId, TEST_USER_ID));
    await db.delete(workspace).where(eq(workspace.id, TEST_WS_ID));
    await db.delete(user).where(eq(user.id, TEST_USER_ID));

    // Seed
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Status Test User",
      email: "status-test@example.com",
    });

    await db.insert(workspace).values({
      id: TEST_WS_ID,
      name: "Status Test Workspace",
      slug: "status-test",
      urlSlug: "status-test",
    });

    await db.insert(member).values({
      userId: TEST_USER_ID,
      workspaceId: TEST_WS_ID,
      role: "admin",
    });

    await db.insert(team).values({
      id: TEST_TEAM_ID,
      workspaceId: TEST_WS_ID,
      name: "Status Team",
      key: "STAT",
    });

    await db.insert(workflowState).values({
      id: TEST_STATE_ID,
      teamId: TEST_TEAM_ID,
      name: "Todo",
      category: "unstarted",
      position: 1,
    });
  });

  afterAll(async () => {
    await db.delete(workflowState).where(eq(workflowState.id, TEST_STATE_ID));
    await db.delete(team).where(eq(team.id, TEST_TEAM_ID));
    await db.delete(member).where(eq(member.userId, TEST_USER_ID));
    await db.delete(workspace).where(eq(workspace.id, TEST_WS_ID));
    await db.delete(user).where(eq(user.id, TEST_USER_ID));
  });

  it("GET returns grouped team statuses", async () => {
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: TEST_USER_ID },
    });
    
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ key: "STAT" }),
    });
    
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.statuses.unstarted).toHaveLength(1);
    expect(data.statuses.unstarted[0].name).toBe("Todo");
    expect(data.statuses.backlog).toBeDefined();
  });
});
