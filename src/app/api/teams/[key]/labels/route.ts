import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { label } from "@/lib/db/schema";
import { findAccessibleTeam } from "@/lib/teams";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  const teamRecord = await findAccessibleTeam(key, session.user.id);

  if (!teamRecord) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const labels = await db
    .select({
      id: label.id,
      name: label.name,
      color: label.color,
    })
    .from(label)
    .where(eq(label.teamId, teamRecord.id));

  return NextResponse.json({ labels });
}
