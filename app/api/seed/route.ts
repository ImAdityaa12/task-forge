import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { statuses, assignees, tickets } from "@/lib/schema";
import { nanoid } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Clear existing data for this user
  await db.delete(tickets).where(eq(tickets.userId, userId));
  await db.delete(assignees).where(eq(assignees.userId, userId));
  await db.delete(statuses).where(eq(statuses.userId, userId));

  // Create statuses
  const statusData = [
    { name: "Backlog", color: "#6b7280", position: 0 },
    { name: "To Do", color: "#6366f1", position: 1 },
    { name: "In Progress", color: "#eab308", position: 2 },
    { name: "Done", color: "#22c55e", position: 3 },
  ];

  const statusIds: Record<string, string> = {};
  for (const s of statusData) {
    const id = nanoid();
    statusIds[s.name] = id;
    await db.insert(statuses).values({
      id,
      userId,
      name: s.name,
      color: s.color,
      position: s.position,
    });
  }

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
    { title: "Research competitor pricing pages", statusKey: "Backlog", priority: "low" as const, assigneeIdx: 0, position: 0 },
    { title: "Write API documentation for v2 endpoints", statusKey: "Backlog", priority: "none" as const, assigneeIdx: null, position: 1 },
    { title: "Evaluate new logging service options", statusKey: "Backlog", priority: "low" as const, assigneeIdx: 2, position: 2 },
    { title: "Design onboarding flow for new users", statusKey: "To Do", priority: "high" as const, assigneeIdx: 0, position: 0 },
    { title: "Add dark mode toggle to settings", statusKey: "To Do", priority: "medium" as const, assigneeIdx: 1, position: 1 },
    { title: "Set up CI/CD pipeline for staging", statusKey: "To Do", priority: "high" as const, assigneeIdx: 2, position: 2 },
    { title: "Fix login redirect loop on expired sessions", statusKey: "In Progress", priority: "urgent" as const, assigneeIdx: 1, position: 0 },
    { title: "Build dashboard analytics charts", statusKey: "In Progress", priority: "medium" as const, assigneeIdx: 0, position: 1 },
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

  return Response.json({
    message: "Seed complete",
    statuses: statusData.length,
    assignees: assigneeData.length,
    tickets: ticketData.length,
  });
}
