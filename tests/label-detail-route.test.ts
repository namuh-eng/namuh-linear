import { PATCH, DELETE } from "@/app/api/labels/[id]/route";
import { db } from "@/lib/db";
import { label, user, workspace, member } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { describe, expect, it, beforeAll, afterAll, vi } from "vitest";

const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
const TEST_WS_ID = "00000000-0000-0000-0000-000000000002";
const TEST_LABEL_ID = "00000000-0000-0000-0000-000000000004";

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
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

describe("Label Item API Route", () => {
  beforeAll(async () => {
    // Cleanup
    await db.delete(label).where(eq(label.id, TEST_LABEL_ID));
    await db.delete(member).where(eq(member.userId, TEST_USER_ID));
    await db.delete(workspace).where(eq(workspace.id, TEST_WS_ID));
    await db.delete(user).where(eq(user.id, TEST_USER_ID));

    // Seed
    await db.insert(user).values({
      id: TEST_USER_ID,
      name: "Label Test User",
      email: "label-test@example.com",
    });

    await db.insert(workspace).values({
      id: TEST_WS_ID,
      name: "Label Test Workspace",
      slug: "label-test",
      urlSlug: "label-test",
    });

    await db.insert(member).values({
      userId: TEST_USER_ID,
      workspaceId: TEST_WS_ID,
      role: "admin",
    });

    await db.insert(label).values({
      id: TEST_LABEL_ID,
      workspaceId: TEST_WS_ID,
      name: "Initial Label",
      color: "#ff0000",
    });
  });

  afterAll(async () => {
    await db.delete(label).where(eq(label.id, TEST_LABEL_ID));
    await db.delete(member).where(eq(member.userId, TEST_USER_ID));
    await db.delete(workspace).where(eq(workspace.id, TEST_WS_ID));
    await db.delete(user).where(eq(user.id, TEST_USER_ID));
  });

  it("PATCH updates label", async () => {
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: TEST_USER_ID },
    });
    
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({
        name: "Updated Label",
        description: "New description",
      }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TEST_LABEL_ID }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.label.name).toBe("Updated Label");
    expect(data.label.description).toBe("New description");

    // Verify in DB
    const [dbLabel] = await db.select().from(label).where(eq(label.id, TEST_LABEL_ID));
    expect(dbLabel.name).toBe("Updated Label");
  });

  it("DELETE removes label", async () => {
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: TEST_USER_ID },
    });

    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: TEST_LABEL_ID }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify label is gone
    const labels = await db.select().from(label).where(eq(label.id, TEST_LABEL_ID));
    expect(labels).toHaveLength(0);
  });
});
