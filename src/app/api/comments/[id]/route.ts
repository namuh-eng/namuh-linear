import { requireApiSession } from "@/lib/api-auth";
import { findAuthorizedCommentRef } from "@/lib/api-authz";
import { db } from "@/lib/db";
import { comment, commentAttachment } from "@/lib/db/schema";
import { deleteFile } from "@/lib/s3";
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
  const commentRef = await findAuthorizedCommentRef(id, session.user.id);
  if (!commentRef || commentRef.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Comment not found or unauthorized" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const nextBody = typeof body.body === "string" ? body.body.trim() : "";

  if (!nextBody) {
    return NextResponse.json(
      { error: "Comment body is required" },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(comment)
    .set({ body: nextBody, updatedAt: new Date() })
    .where(
      and(eq(comment.id, commentRef.id), eq(comment.userId, session.user.id)),
    )
    .returning();

  if (!updated) {
    return NextResponse.json(
      { error: "Comment not found or unauthorized" },
      { status: 404 },
    );
  }

  return NextResponse.json(updated);
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
  const commentRef = await findAuthorizedCommentRef(id, session.user.id);
  if (!commentRef || commentRef.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Comment not found or unauthorized" },
      { status: 404 },
    );
  }

  const attachments = await db
    .select({ storageKey: commentAttachment.storageKey })
    .from(commentAttachment)
    .where(eq(commentAttachment.commentId, commentRef.id));

  await db.transaction(async (tx) => {
    await tx
      .delete(commentAttachment)
      .where(eq(commentAttachment.commentId, commentRef.id));
    await tx
      .delete(comment)
      .where(
        and(eq(comment.id, commentRef.id), eq(comment.userId, session.user.id)),
      );
  });

  await Promise.all(
    attachments.map(async (currentAttachment) => {
      try {
        await deleteFile(currentAttachment.storageKey);
      } catch {
        // Ignore S3 deletion errors
      }
    }),
  );

  return NextResponse.json({ success: true });
}
