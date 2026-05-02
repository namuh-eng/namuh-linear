import { requireApiSession } from "@/lib/api-auth";
import {
  findAuthorizedLabelRef,
  resolveActiveWorkspaceRef,
} from "@/lib/api-authz";
import { db } from "@/lib/db";
import { issueLabel, label } from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const activeWorkspace = await resolveActiveWorkspaceRef(session.user.id);
  if (!activeWorkspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const { workspaceId } = activeWorkspace;

  // Get workspace-scoped labels (teamId is null) with issue counts
  const labels = await db
    .select({
      id: label.id,
      name: label.name,
      color: label.color,
      description: label.description,
      parentLabelId: label.parentLabelId,
      createdAt: label.createdAt,
      updatedAt: label.updatedAt,
      issueCount: sql<number>`count(${issueLabel.issueId})::int`,
    })
    .from(label)
    .leftJoin(issueLabel, eq(label.id, issueLabel.labelId))
    .where(and(eq(label.workspaceId, workspaceId), isNull(label.teamId)))
    .groupBy(label.id)
    .orderBy(label.name);

  const result = labels.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    description: l.description,
    parentLabelId: l.parentLabelId,
    issueCount: l.issueCount,
    lastApplied: l.issueCount > 0 ? l.updatedAt?.toISOString() : null,
    createdAt: l.createdAt.toISOString(),
  }));

  return NextResponse.json({ labels: result });
}

export async function POST(request: Request) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const activeWorkspace = await resolveActiveWorkspaceRef(session.user.id);
  if (!activeWorkspace) {
    return NextResponse.json({ error: "No workspace" }, { status: 404 });
  }

  const { workspaceId } = activeWorkspace;
  const body = await request.json();
  const { name, color, description, parentLabelId } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let nextParentLabelId: string | null = null;
  if (parentLabelId) {
    const parentLabel = await findAuthorizedLabelRef(
      String(parentLabelId),
      session.user.id,
    );
    if (!parentLabel || parentLabel.teamId !== null) {
      return NextResponse.json(
        { error: "Parent label not found" },
        { status: 400 },
      );
    }
    nextParentLabelId = parentLabel.id;
  }

  const [newLabel] = await db
    .insert(label)
    .values({
      name,
      color: color || "#6b6f76",
      description: description || null,
      workspaceId,
      parentLabelId: nextParentLabelId,
    })
    .returning();

  return NextResponse.json({ label: newLabel }, { status: 201 });
}
