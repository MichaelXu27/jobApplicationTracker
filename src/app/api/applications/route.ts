import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { applicationSchema } from "@/lib/validations";
import type { ApplicationStatus } from "@/types";

// ---------------------------------------------------------------------------
// GET /api/applications
// Query params: status, search, sortOrder (asc|desc), page, limit
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") as ApplicationStatus | null;
  const search = searchParams.get("search") ?? "";
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const skip = (page - 1) * limit;

  const VALID_STATUSES: ApplicationStatus[] = ["APPLIED", "INTERVIEWING", "DENIED"];

  // Build the where clause — always scoped to the current user
  const where = {
    userId: session.user.id,
    ...(status && VALID_STATUSES.includes(status) ? { status } : {}),
    ...(search.trim()
      ? {
          OR: [
            { jobTitle: { contains: search, mode: "insensitive" as const } },
            { company: { contains: search, mode: "insensitive" as const } },
            { location: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [applications, total] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { dateApplied: sortOrder },
      skip,
      take: limit,
    }),
    db.application.count({ where }),
  ]);

  return NextResponse.json({
    data: applications,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// ---------------------------------------------------------------------------
// POST /api/applications
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const result = applicationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { dateApplied, ...rest } = result.data;

    const application = await db.application.create({
      data: {
        ...rest,
        dateApplied: new Date(dateApplied),
        userId: session.user.id,
        // Normalize empty strings to null for optional fields
        location: rest.location || null,
        notes: rest.notes || null,
        jobDescription: rest.jobDescription || null,
        jobLink: rest.jobLink || null,
        salary: rest.salary || null,
        recruiterContact: rest.recruiterContact || null,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("[POST /api/applications]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
