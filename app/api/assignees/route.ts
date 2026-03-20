import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignees } from "@/lib/schema";
import { nanoid } from "@/lib/utils";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const userAssignees = await db
    .select()
    .from(assignees)
    .where(eq(assignees.userId, userId));

  return Response.json(userAssignees);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { name, email, avatarUrl, linkedUserId } = body;

  if (!name || typeof name !== "string") {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  // Dedup: if linking an app user, check if an assignee already exists for them
  if (linkedUserId) {
    const [existing] = await db
      .select()
      .from(assignees)
      .where(
        and(
          eq(assignees.userId, userId),
          eq(assignees.linkedUserId, linkedUserId)
        )
      );
    if (existing) return Response.json(existing, { status: 200 });
  }

  const id = nanoid();
  await db.insert(assignees).values({
    id,
    userId,
    name: name.trim(),
    email: email || null,
    avatarUrl: avatarUrl || null,
    linkedUserId: linkedUserId || null,
  });

  const [created] = await db
    .select()
    .from(assignees)
    .where(eq(assignees.id, id));

  return Response.json(created, { status: 201 });
}
