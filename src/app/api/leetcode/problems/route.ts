import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problems = await db.problem.findMany({
    orderBy: [{ topic: "asc" }, { difficulty: "asc" }, { title: "asc" }],
  });

  return NextResponse.json({ items: problems, next_cursor: null });
}
