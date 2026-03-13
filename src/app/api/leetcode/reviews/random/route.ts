import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Prefer problems that are due for review
  let reviews = await db.userProblem.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["solved", "review"] },
      nextReviewAt: { lte: now },
    },
    include: { problem: true },
    orderBy: { nextReviewAt: "asc" },
    take: 3,
  });

  // Fall back to any solved/review problems if none are due
  if (reviews.length === 0) {
    const all = await db.userProblem.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["solved", "review"] },
      },
      include: { problem: true },
    });
    // Shuffle and take up to 3
    const shuffled = all.sort(() => Math.random() - 0.5);
    reviews = shuffled.slice(0, 3);
  }

  return NextResponse.json(reviews);
}
