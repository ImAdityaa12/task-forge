import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, user } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, id), eq(comments.userId, userId)));

  if (!existing) {
    return Response.json({ error: "Comment not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  await db
    .update(comments)
    .set({ content: content.trim(), updatedAt: new Date() })
    .where(and(eq(comments.id, id), eq(comments.userId, userId)));

  const [updated] = await db
    .select({
      id: comments.id,
      userId: comments.userId,
      ticketId: comments.ticketId,
      parentCommentId: comments.parentCommentId,
      content: comments.content,
      authorName: user.name,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
    })
    .from(comments)
    .innerJoin(user, eq(comments.userId, user.id))
    .where(eq(comments.id, id));

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;

  const [existing] = await db
    .select()
    .from(comments)
    .where(and(eq(comments.id, id), eq(comments.userId, userId)));

  if (!existing) {
    return Response.json({ error: "Comment not found" }, { status: 404 });
  }

  // Delete comment and all nested replies (recursive via parentCommentId)
  // Since we don't have cascade on parentCommentId, delete children first
  await deleteCommentTree(id, userId);

  return Response.json({ success: true });
}

async function deleteCommentTree(commentId: string, userId: string) {
  // Find all direct children
  const children = await db
    .select()
    .from(comments)
    .where(eq(comments.parentCommentId, commentId));

  // Recursively delete children
  for (const child of children) {
    await deleteCommentTree(child.id, userId);
  }

  // Delete this comment
  await db
    .delete(comments)
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId)));
}
