import { requireApiSession } from "@/lib/api-auth";
import { findAuthorizedIssueRef } from "@/lib/api-authz";
import { db } from "@/lib/db";
import { issue } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const { id } = await params;
  const issueRef = await findAuthorizedIssueRef(id, session.user.id);
  if (!issueRef) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  const issues = await db
    .select({
      id: issue.id,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    })
    .from(issue)
    .where(and(eq(issue.id, issueRef.id), eq(issue.teamId, issueRef.teamId)))
    .limit(1);

  if (issues.length === 0) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  }

  return NextResponse.json({
    history: [
      { id: "h1", type: "created", createdAt: issues[0].createdAt },
      { id: "h2", type: "updated", createdAt: issues[0].updatedAt },
    ],
  });
}
