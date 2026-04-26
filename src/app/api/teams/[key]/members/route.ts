import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamMember, user } from "@/lib/db/schema";
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

  const members = await db
    .select({
      id: teamMember.id,
      userId: teamMember.userId,
      name: user.name,
      email: user.email,
      role: teamMember.role,
    })
    .from(teamMember)
    .innerJoin(user, eq(teamMember.userId, user.id))
    .where(eq(teamMember.teamId, teamRecord.id));

  return NextResponse.json({ members });
}
