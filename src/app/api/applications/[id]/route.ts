import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { applicationSchema } from "@/lib/validations";

type RouteContext = { params: { id: string } };

// ---------------------------------------------------------------------------
// Helper — fetch application and verify ownership
// ---------------------------------------------------------------------------

async function getOwnedApplication(id: string, userId: string) {
  const application = await db.application.findUnique({ where: { id } });

  if (!application) return { application: null, error: "Not found", status: 404 };
  if (application.userId !== userId) return { application: null, error: "Forbidden", status: 403 };

  return { application, error: null, status: 200 };
}

// ---------------------------------------------------------------------------
// GET /api/applications/[id]
// ---------------------------------------------------------------------------

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { application, error, status } = await getOwnedApplication(
    params.id,
    session.user.id
  );

  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json(application);
}

// ---------------------------------------------------------------------------
// PUT /api/applications/[id]
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { application, error, status } = await getOwnedApplication(
    params.id,
    session.user.id
  );
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();

    // Use partial schema for updates — only provided fields are validated
    const result = applicationSchema.partial().safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { dateApplied, ...rest } = result.data;

    const updated = await db.application.update({
      where: { id: application!.id },
      data: {
        ...rest,
        ...(dateApplied ? { dateApplied: new Date(dateApplied) } : {}),
        // Normalize optional empty strings to null
        location: rest.location !== undefined ? (rest.location || null) : undefined,
        notes: rest.notes !== undefined ? (rest.notes || null) : undefined,
        jobDescription: rest.jobDescription !== undefined ? (rest.jobDescription || null) : undefined,
        jobLink: rest.jobLink !== undefined ? (rest.jobLink || null) : undefined,
        salary: rest.salary !== undefined ? (rest.salary || null) : undefined,
        recruiterContact: rest.recruiterContact !== undefined ? (rest.recruiterContact || null) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/applications/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/applications/[id]
// ---------------------------------------------------------------------------

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { application, error, status } = await getOwnedApplication(
    params.id,
    session.user.id
  );
  if (error) return NextResponse.json({ error }, { status });

  await db.application.delete({ where: { id: application!.id } });

  return NextResponse.json({ message: "Deleted successfully" });
}
