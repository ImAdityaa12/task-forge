import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { statuses } from "@/lib/schema";
import { nanoid } from "@/lib/utils";
import { eq, asc, count } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  let userStatuses = await db
    .select()
    .from(statuses)
    .where(eq(statuses.userId, userId))
    .orderBy(asc(statuses.position));

  // Auto-seed default statuses on first load
  if (userStatuses.length === 0) {
    const defaults = [
      { name: "Backlog", color: "#6b7280", position: 0 },
      { name: "To Do", color: "#6366f1", position: 1 },
      { name: "In Progress", color: "#eab308", position: 2 },
      { name: "Done", color: "#22c55e", position: 3 },
    ];

    for (const d of defaults) {
      await db.insert(statuses).values({
        id: nanoid(),
        userId,
        name: d.name,
        color: d.color,
        position: d.position,
      });
    }

    userStatuses = await db
      .select()
      .from(statuses)
      .where(eq(statuses.userId, userId))
      .orderBy(asc(statuses.position));
  }

  return Response.json(userStatuses);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { name, color } = body;

  if (!name || typeof name !== "string") {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  // Get next position
  const result = await db
    .select({ count: count() })
    .from(statuses)
    .where(eq(statuses.userId, userId));
  const nextPosition = result[0]?.count ?? 0;

  const id = nanoid();
  await db.insert(statuses).values({
    id,
    userId,
    name: name.trim(),
    color: color || "#6b7280",
    position: nextPosition,
  });

  const [created] = await db
    .select()
    .from(statuses)
    .where(eq(statuses.id, id));

  return Response.json(created, { status: 201 });
}
