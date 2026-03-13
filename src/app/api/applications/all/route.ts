import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// DELETE /api/applications/all
// Deletes every application belonging to the authenticated user.
// DEV USE ONLY — no UI guard beyond the confirmation in the Navbar.
// ---------------------------------------------------------------------------

export async function DELETE() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { count } = await db.application.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ deleted: count });
}
