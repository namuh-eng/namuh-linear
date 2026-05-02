import { requireApiSession } from "@/lib/api-auth";
import { findTeamContextForWorkspaceSwitchOnly } from "@/lib/api-authz";
import { db } from "@/lib/db";
import { team } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const { key } = await params;
  const context = await findTeamContextForWorkspaceSwitchOnly(
    key,
    session.user.id,
  );

  if (!context) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const teams = await db
    .select({ id: team.id, name: team.name, key: team.key })
    .from(team)
    .where(eq(team.workspaceId, context.workspaceId));

  return NextResponse.json({
    ...context,
    workspaceInitials: context.workspaceName.substring(0, 2).toUpperCase(),
    teams,
  });
}
