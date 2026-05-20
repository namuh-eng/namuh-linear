import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { notification } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

async function updateNotificationSnooze(
  id: string,
  userId: string,
  values: {
    snoozedUntilAt: Date | null;
    unsnoozedAt: Date | null;
  },
) {
  return db
    .update(notification)
    .set(values)
    .where(and(eq(notification.id, id), eq(notification.userId, userId)))
    .returning({ id: notification.id });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const body = (await request.json().catch(() => null)) as {
    snoozedUntilAt?: unknown;
  } | null;
  const snoozedUntilAt =
    typeof body?.snoozedUntilAt === "string"
      ? new Date(body.snoozedUntilAt)
      : null;

  if (!snoozedUntilAt || Number.isNaN(snoozedUntilAt.getTime())) {
    return NextResponse.json(
      { error: "snoozedUntilAt must be a valid ISO date" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const updated = await updateNotificationSnooze(id, session.user.id, {
    snoozedUntilAt,
    unsnoozedAt: null,
  });

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    snoozedUntilAt: snoozedUntilAt.toISOString(),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const { id } = await params;
  const unsnoozedAt = new Date();
  const updated = await updateNotificationSnooze(id, session.user.id, {
    snoozedUntilAt: null,
    unsnoozedAt,
  });

  if (updated.length === 0) {
    return NextResponse.json(
      { error: "Notification not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    unsnoozedAt: unsnoozedAt.toISOString(),
  });
}
