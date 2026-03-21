import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { ticketId, targetStatusId, newPosition } = await request.json();

  if (!ticketId || !targetStatusId || newPosition === undefined) {
    return Response.json(
      { error: "ticketId, targetStatusId, and newPosition are required" },
      { status: 400 }
    );
  }

  // Verify ticket exists
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId));

  if (!ticket) {
    return Response.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Move ticket to new status and position
  await db
    .update(tickets)
    .set({
      statusId: targetStatusId,
      position: newPosition,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId));

  // Reindex all tickets in the target column
  const columnTickets = await db
    .select()
    .from(tickets)
    .where(eq(tickets.statusId, targetStatusId))
    .orderBy(asc(tickets.position));

  // Place moved ticket at desired position, reindex others
  const ordered = columnTickets.filter((t) => t.id !== ticketId);
  ordered.splice(
    Math.min(newPosition, ordered.length),
    0,
    columnTickets.find((t) => t.id === ticketId)!
  );

  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i].position !== i) {
      await db
        .update(tickets)
        .set({ position: i })
        .where(eq(tickets.id, ordered[i].id));
    }
  }

  // Also reindex old column if status changed
  if (ticket.statusId !== targetStatusId) {
    const oldColumnTickets = await db
      .select()
      .from(tickets)
      .where(eq(tickets.statusId, ticket.statusId))
      .orderBy(asc(tickets.position));

    for (let i = 0; i < oldColumnTickets.length; i++) {
      if (oldColumnTickets[i].position !== i) {
        await db
          .update(tickets)
          .set({ position: i })
          .where(eq(tickets.id, oldColumnTickets[i].id));
      }
    }
  }

  return Response.json({ success: true });
}
