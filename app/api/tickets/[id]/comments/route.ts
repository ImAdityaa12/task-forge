import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { comments, tickets, user } from "@/lib/schema";
import { nanoid } from "@/lib/utils";
import { eq, and, asc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: ticketId } = await params;

  // Verify ticket exists
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId));

  if (!ticket) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  const ticketComments = await db
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
    .where(eq(comments.ticketId, ticketId))
    .orderBy(asc(comments.createdAt));

  return Response.json(ticketComments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: ticketId } = await params;
  const userId = session.user.id;

  // Verify ticket exists
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId));

  if (!ticket) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  const body = await request.json();
  const { content, parentCommentId } = body;

  if (!content || typeof content !== "string" || !content.trim()) {
    return Response.json({ error: "Content is required" }, { status: 400 });
  }

  // Verify parent comment exists if provided
  if (parentCommentId) {
    const [parent] = await db
      .select()
      .from(comments)
      .where(
        and(eq(comments.id, parentCommentId), eq(comments.ticketId, ticketId))
      );
    if (!parent) {
      return Response.json(
        { error: "Parent comment not found" },
        { status: 404 }
      );
    }
  }

  const id = nanoid();
  await db.insert(comments).values({
    id,
    userId,
    ticketId,
    parentCommentId: parentCommentId || null,
    content: content.trim(),
  });

  const [created] = await db
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

  return Response.json(created, { status: 201 });
}
