import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";
import { and, eq, isNull, not } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH() {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const updated = await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.userId, session.user.id),
        isNull(notification.readAt),
        not(eq(notification.type, "comment")),
      ),
    )
    .returning({ id: notification.id });

  return NextResponse.json({ success: true, updatedCount: updated.length });
}
