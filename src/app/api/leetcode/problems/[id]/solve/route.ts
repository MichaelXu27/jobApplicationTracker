import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function POST(
  req: Request,
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

  const body = await req.json().catch(() => ({}));
  const reviewOutcome: string | null = body.review_outcome ?? null;

  const existing = await db.userProblem.findUnique({
    where: { userId_problemId: { userId: session.user.id, problemId: params.id } },
  });

  let intervalDays = existing?.intervalDays ?? 1;
  let easeFactor = existing?.easeFactor ?? 2.5;
  const now = new Date();

  if (existing && reviewOutcome !== null) {
    // Apply SM2 spaced repetition
    const success = reviewOutcome === "success";
    if (success) {
      intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
    } else {
      intervalDays = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    }
  } else if (!existing) {
    // First solve: default interval of 1 day
    intervalDays = 1;
    easeFactor = 2.5;
  }

  const record = await db.userProblem.upsert({
    where: { userId_problemId: { userId: session.user.id, problemId: params.id } },
    update: {
      status: "review",
      lastSolvedAt: now,
      easeFactor,
      intervalDays,
      nextReviewAt: addDays(now, intervalDays),
    },
    create: {
      userId: session.user.id,
      problemId: params.id,
      status: "review",
      lastSolvedAt: now,
      easeFactor,
      intervalDays,
      nextReviewAt: addDays(now, intervalDays),
    },
    include: { problem: true },
  });

  return NextResponse.json(record);
}
