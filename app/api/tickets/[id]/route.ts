import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifyAssignment, notifyStatusChange } from "@/lib/email";
import { tickets } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [existing] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id));

  if (!existing) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.statusId !== undefined) updates.statusId = body.statusId;
  if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId;
  if (body.categoryId !== undefined) updates.categoryId = body.categoryId;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (body.position !== undefined) updates.position = body.position;
  updates.updatedAt = new Date();

  await db
    .update(tickets)
    .set(updates)
    .where(eq(tickets.id, id));

  const [updated] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id));

  if (
    body.assigneeId !== undefined &&
    body.assigneeId !== existing.assigneeId &&
    body.assigneeId !== null
  ) {
    notifyAssignment({
      ticketId: id,
      ticketTitle: updated.title,
      ticketCreatorUserId: existing.userId,
      newAssigneeId: body.assigneeId,
      actorUserId: session.user.id,
      actorName: session.user.name,
    });
  }

  if (body.statusId !== undefined && body.statusId !== existing.statusId) {
    notifyStatusChange({
      ticketId: id,
      ticketTitle: updated.title,
      ticketCreatorUserId: existing.userId,
      ticketAssigneeId: updated.assigneeId,
      newStatusId: body.statusId,
      actorName: session.user.name,
    });
  }

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

  const [existing] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id));

  if (!existing) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  await db
    .delete(tickets)
    .where(eq(tickets.id, id));

  return Response.json({ success: true });
}
