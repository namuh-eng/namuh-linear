import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import {
  type InboxNotificationPreferencesPatch,
  mergeInboxNotificationPreferences,
  readInboxNotificationPreferencesFromUserSettings,
  writeInboxNotificationPreferencesToUserSettings,
} from "@/lib/notifications";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function findCurrentUser(userId: string) {
  const [currentUser] = await db
    .select({ id: user.id, settings: user.settings })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return currentUser ?? null;
}

export async function PATCH(request: Request) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const currentUser = await findCurrentUser(session.user.id);
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as {
    preferences?: InboxNotificationPreferencesPatch;
  } | null;

  if (!body?.preferences) {
    return NextResponse.json(
      { error: "preferences is required" },
      { status: 400 },
    );
  }

  const currentPreferences = readInboxNotificationPreferencesFromUserSettings(
    currentUser.settings,
  );
  const nextPreferences = mergeInboxNotificationPreferences(
    currentPreferences,
    body.preferences,
  );

  await db
    .update(user)
    .set({
      settings: writeInboxNotificationPreferencesToUserSettings(
        currentUser.settings,
        nextPreferences,
      ),
      updatedAt: new Date(),
    })
    .where(eq(user.id, currentUser.id));

  return NextResponse.json({ preferences: nextPreferences });
}
