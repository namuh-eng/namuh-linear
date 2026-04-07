import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { issue, notification, user } from "@/lib/db/schema";
import { desc, eq, isNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Alias for actor user
  const actor = user;

  const notifications = await db
    .select({
      id: notification.id,
      type: notification.type,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      actorName: actor.name,
      actorImage: actor.image,
      issueId: notification.issueId,
      issueIdentifier: issue.identifier,
      issueTitle: issue.title,
      issuePriority: issue.priority,
    })
    .from(notification)
    .leftJoin(actor, eq(notification.actorId, actor.id))
    .leftJoin(issue, eq(notification.issueId, issue.id))
    .where(eq(notification.userId, userId))
    .orderBy(desc(notification.createdAt))
    .limit(100);

  const unreadCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notification)
    .where(
      sql`${notification.userId} = ${userId} AND ${notification.readAt} IS NULL`,
    );

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      actorName: n.actorName ?? "Unknown",
      actorImage: n.actorImage ?? null,
      issueIdentifier: n.issueIdentifier ?? "",
      issueTitle: n.issueTitle ?? "",
      issuePriority: n.issuePriority ?? "none",
      issueId: n.issueId,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: unreadCount[0]?.count ?? 0,
  });
}
