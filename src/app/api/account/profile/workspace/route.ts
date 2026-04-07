import { resolveActiveWorkspaceId } from "@/lib/active-workspace";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeWorkspaceId = await resolveActiveWorkspaceId(session.user.id);
  if (!activeWorkspaceId) {
    return NextResponse.json(
      { error: "No active workspace found" },
      { status: 404 },
    );
  }

  await db
    .delete(member)
    .where(
      and(
        eq(member.userId, session.user.id),
        eq(member.workspaceId, activeWorkspaceId),
      ),
    );

  const remainingMemberships = await db
    .select({ workspaceId: member.workspaceId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .orderBy(desc(member.createdAt))
    .limit(50);

  const nextWorkspaceId = remainingMemberships[0]?.workspaceId ?? null;
  const response = NextResponse.json({
    success: true,
    redirectTo: nextWorkspaceId ? "/" : "/create-workspace",
  });

  if (nextWorkspaceId) {
    response.cookies.set("activeWorkspaceId", nextWorkspaceId, {
      path: "/",
      sameSite: "lax",
    });
  } else {
    response.cookies.delete("activeWorkspaceId");
  }

  return response;
}
