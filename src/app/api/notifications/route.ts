import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { issue, notification, user } from "@/lib/db/schema";
import { readInboxNotificationPreferencesFromUserSettings } from "@/lib/notifications";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const userId = session.user.id;

  const [currentUser] = await db
    .select({ settings: user.settings })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  const actor = user;

  const notifications = await db
    .select({
      id: notification.id,
      type: notification.type,
      readAt: notification.readAt,
      snoozedUntilAt: notification.snoozedUntilAt,
      unsnoozedAt: notification.unsnoozedAt,
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
      snoozedUntilAt: n.snoozedUntilAt?.toISOString() ?? null,
      unsnoozedAt: n.unsnoozedAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount: unreadCount[0]?.count ?? 0,
    preferences: readInboxNotificationPreferencesFromUserSettings(
      currentUser?.settings,
    ),
  });
}
