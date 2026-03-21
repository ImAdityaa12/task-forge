import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignees } from "@/lib/schema";
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
    .from(assignees)
    .where(eq(assignees.id, id));

  if (!existing) {
    return Response.json({ error: "Assignee not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;

  await db
    .update(assignees)
    .set(updates)
    .where(eq(assignees.id, id));

  const [updated] = await db
    .select()
    .from(assignees)
    .where(eq(assignees.id, id));

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
    .from(assignees)
    .where(eq(assignees.id, id));

  if (!existing) {
    return Response.json({ error: "Assignee not found" }, { status: 404 });
  }

  await db
    .delete(assignees)
    .where(eq(assignees.id, id));

  return Response.json({ success: true });
}
