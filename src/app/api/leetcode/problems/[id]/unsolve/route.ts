import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const problem = await db.problem.findUnique({ where: { id: params.id } });
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  const record = await db.userProblem.upsert({
    where: { userId_problemId: { userId: session.user.id, problemId: params.id } },
    update: {
      status: "unsolved",
      lastSolvedAt: null,
      nextReviewAt: null,
      intervalDays: 1,
      easeFactor: 2.5,
    },
    create: {
      userId: session.user.id,
      problemId: params.id,
      status: "unsolved",
    },
    include: { problem: true },
  });

  return NextResponse.json(record);
}
