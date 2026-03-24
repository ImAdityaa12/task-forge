import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, tickets } from "@/lib/schema";
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
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  if (!existing) {
    return Response.json({ error: "Category not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.color !== undefined) updates.color = body.color;
  updates.updatedAt = new Date();

  await db
    .update(categories)
    .set(updates)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  const [updated] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));

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
    .from(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  if (!existing) {
    return Response.json({ error: "Category not found" }, { status: 404 });
  }

  // Unlink tickets before deleting (cascade set null handles this via FK)
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)));

  return Response.json({ success: true });
}
