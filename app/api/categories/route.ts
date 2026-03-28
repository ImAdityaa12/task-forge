import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/schema";
import { nanoid } from "@/lib/utils";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session)
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.createdAt));

  return Response.json(allCategories);
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

  const id = nanoid();
  await db.insert(categories).values({
    id,
    userId,
    name: name.trim(),
    color: color || "#6b7280",
  });

  const [created] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id));

  return Response.json(created, { status: 201 });
}
