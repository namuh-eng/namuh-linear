import { requireApiSession } from "@/lib/api-auth";
import { findAuthorizedLabelRef } from "@/lib/api-authz";
import { db } from "@/lib/db";
import { label } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const { id } = await params;
  const labelRef = await findAuthorizedLabelRef(id, session.user.id);
  if (!labelRef?.workspaceId) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }
  const { workspaceId } = labelRef;

  const body = await request.json();

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.color !== undefined) updates.color = body.color;
  if (body.description !== undefined) updates.description = body.description;

  const [updated] = await db
    .update(label)
    .set(updates)
    .where(and(eq(label.id, labelRef.id), eq(label.workspaceId, workspaceId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  return NextResponse.json({ label: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response: authResponse, session } = await requireApiSession();
  if (authResponse) {
    return authResponse;
  }

  const { id } = await params;
  const labelRef = await findAuthorizedLabelRef(id, session.user.id);
  if (!labelRef?.workspaceId) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }
  const { workspaceId } = labelRef;

  const [deleted] = await db
    .delete(label)
    .where(and(eq(label.id, labelRef.id), eq(label.workspaceId, workspaceId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
