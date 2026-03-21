import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { statuses, assignees, tickets } from "@/lib/schema";
import { nanoid } from "@/lib/utils";
import { eq, asc, count } from "drizzle-orm";
import { headers } from "next/headers";

async function seedDummyData(userId: string, statusIds: Record<string, string>) {
  // Create assignees
  const assigneeData = [
    { name: "Alice Chen", email: "alice@taskforge.dev" },
    { name: "Bob Rivera", email: "bob@taskforge.dev" },
    { name: "Carol Park", email: "carol@taskforge.dev" },
  ];

  const assigneeIds: string[] = [];
  for (const a of assigneeData) {
    const id = nanoid();
    assigneeIds.push(id);
    await db.insert(assignees).values({
      id,
      userId,
      name: a.name,
      email: a.email,
    });
  }

  // Create tickets
  const ticketData = [
    // Backlog
    { title: "Research competitor pricing pages", statusKey: "Backlog", priority: "low" as const, assigneeIdx: 0, position: 0 },
    { title: "Write API documentation for v2 endpoints", statusKey: "Backlog", priority: "none" as const, assigneeIdx: null, position: 1 },
    { title: "Evaluate new logging service options", statusKey: "Backlog", priority: "low" as const, assigneeIdx: 2, position: 2 },
    // To Do
    { title: "Design onboarding flow for new users", statusKey: "To Do", priority: "high" as const, assigneeIdx: 0, position: 0 },
    { title: "Add dark mode toggle to settings", statusKey: "To Do", priority: "medium" as const, assigneeIdx: 1, position: 1 },
    { title: "Set up CI/CD pipeline for staging", statusKey: "To Do", priority: "high" as const, assigneeIdx: 2, position: 2 },
    // In Progress
    { title: "Fix login redirect loop on expired sessions", statusKey: "In Progress", priority: "urgent" as const, assigneeIdx: 1, position: 0 },
    { title: "Build dashboard analytics charts", statusKey: "In Progress", priority: "medium" as const, assigneeIdx: 0, position: 1 },
    // Done
    { title: "Migrate database to Neon PostgreSQL", statusKey: "Done", priority: "high" as const, assigneeIdx: 2, position: 0 },
    { title: "Set up Better Auth with email/password", statusKey: "Done", priority: "medium" as const, assigneeIdx: 1, position: 1 },
  ];

  for (const t of ticketData) {
    await db.insert(tickets).values({
      id: nanoid(),
      userId,
      title: t.title,
      description: "",
      statusId: statusIds[t.statusKey],
      assigneeId: t.assigneeIdx !== null ? assigneeIds[t.assigneeIdx] : null,
      priority: t.priority,
      position: t.position,
    });
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  let userStatuses = await db
    .select()
    .from(statuses)
    .orderBy(asc(statuses.position));

  // Auto-seed default statuses + dummy data when none exist globally
  if (userStatuses.length === 0) {
    const defaults = [
      { name: "Backlog", color: "#6b7280", position: 0 },
      { name: "To Do", color: "#6366f1", position: 1 },
      { name: "In Progress", color: "#eab308", position: 2 },
      { name: "Done", color: "#22c55e", position: 3 },
    ];

    const statusIds: Record<string, string> = {};

    for (const d of defaults) {
      const id = nanoid();
      statusIds[d.name] = id;
      await db.insert(statuses).values({
        id,
        userId,
        name: d.name,
        color: d.color,
        position: d.position,
      });
    }

    // Seed dummy assignees and tickets
    await seedDummyData(userId, statusIds);

    userStatuses = await db
      .select()
      .from(statuses)
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
    .from(statuses);
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
