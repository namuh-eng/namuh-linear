import { db } from "@/lib/db";
import { member, workspace } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function resolveActiveWorkspaceId(userId: string) {
  const cookieStore = await cookies();
  const preferredWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

  const memberships = await db
    .select({ workspaceId: member.workspaceId })
    .from(member)
    .innerJoin(workspace, eq(member.workspaceId, workspace.id))
    .where(eq(member.userId, userId))
    .orderBy(desc(member.createdAt))
    .limit(50);

  if (memberships.length === 0) {
    return null;
  }

  return (
    memberships.find(
      (membership) => membership.workspaceId === preferredWorkspaceId,
    )?.workspaceId ?? memberships[0].workspaceId
  );
}
