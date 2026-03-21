import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets } from "@/lib/schema";
import { nanoid } from "@/lib/utils";
import { eq, asc, count } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userTickets = await db
    .select()
    .from(tickets)
    .orderBy(asc(tickets.position));

  return Response.json(userTickets);
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json();
  const { title, description, statusId, assigneeId, priority } = body;

  if (!title || typeof title !== "string") {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  if (!statusId) {
    return Response.json({ error: "Status ID is required" }, { status: 400 });
  }

  // Get next position within the status column
  const result = await db
    .select({ count: count() })
    .from(tickets)
    .where(eq(tickets.statusId, statusId));
  const nextPosition = result[0]?.count ?? 0;

  const id = nanoid();
  await db.insert(tickets).values({
    id,
    userId,
    title: title.trim(),
    description: description || "",
    statusId,
    assigneeId: assigneeId || null,
    priority: priority || "none",
    position: nextPosition,
  });

  const [created] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, id));

  return Response.json(created, { status: 201 });
}
