import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { statuses } from "@/lib/schema";
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
  const body = await request.json();

  const [existing] = await db
    .select()
    .from(statuses)
    .where(and(eq(statuses.id, id), eq(statuses.userId, userId)));

  if (!existing) {
    return Response.json({ error: "Status not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.color !== undefined) updates.color = body.color;
  if (body.position !== undefined) updates.position = body.position;
  updates.updatedAt = new Date();

  await db
    .update(statuses)
    .set(updates)
    .where(and(eq(statuses.id, id), eq(statuses.userId, userId)));

  const [updated] = await db
    .select()
    .from(statuses)
    .where(eq(statuses.id, id));

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

  // Prevent deleting last status
  const allStatuses = await db
    .select()
    .from(statuses)
    .where(eq(statuses.userId, userId));

  if (allStatuses.length <= 1) {
    return Response.json(
      { error: "Cannot delete the last status" },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select()
    .from(statuses)
    .where(and(eq(statuses.id, id), eq(statuses.userId, userId)));

  if (!existing) {
    return Response.json({ error: "Status not found" }, { status: 404 });
  }

  await db
    .delete(statuses)
    .where(and(eq(statuses.id, id), eq(statuses.userId, userId)));

  return Response.json({ success: true });
}
