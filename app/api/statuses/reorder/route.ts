import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { statuses } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function PUT(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { orderedIds } = await request.json();

  if (!Array.isArray(orderedIds)) {
    return Response.json(
      { error: "orderedIds must be an array" },
      { status: 400 }
    );
  }

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(statuses)
      .set({ position: i, updatedAt: new Date() })
      .where(eq(statuses.id, orderedIds[i]));
  }

  return Response.json({ success: true });
}
