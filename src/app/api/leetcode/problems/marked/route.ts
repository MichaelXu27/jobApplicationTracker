import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await db.userProblem.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["solved", "review"] },
    },
    select: { problemId: true },
  });

  return NextResponse.json(records.map((r) => r.problemId));
}
