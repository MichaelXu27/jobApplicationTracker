import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { applicationSchema } from "@/lib/validations";
import type { ApplicationPayload } from "@/types";

// ---------------------------------------------------------------------------
// POST /api/applications/bulk
// Body: { applications: ApplicationPayload[] }
// Validates each row, inserts valid ones, returns counts
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const rows: ApplicationPayload[] = Array.isArray(body?.applications)
      ? body.applications
      : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No applications provided" },
        { status: 400 }
      );
    }

    const toInsert: {
      userId: string;
      jobTitle: string;
      company: string;
      dateApplied: Date;
      status: string;
      location: string | null;
      notes: string | null;
      jobDescription: string | null;
      jobLink: string | null;
      salary: string | null;
      recruiterContact: string | null;
    }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const result = applicationSchema.safeParse(rows[i]);
      if (!result.success) {
        errors.push(
          `Row ${i + 1} (${rows[i]?.company ?? "unknown"}): ${result.error.issues.map((e) => e.message).join(", ")}`
        );
        continue;
      }

      const { dateApplied, ...rest } = result.data;
      toInsert.push({
        userId: session.user.id,
        jobTitle: rest.jobTitle,
        company: rest.company,
        dateApplied: new Date(dateApplied),
        status: rest.status,
        location: rest.location || null,
        notes: rest.notes || null,
        jobDescription: rest.jobDescription || null,
        jobLink: rest.jobLink || null,
        salary: rest.salary || null,
        recruiterContact: rest.recruiterContact || null,
      });
    }

    if (toInsert.length > 0) {
      await db.application.createMany({ data: toInsert });
    }

    return NextResponse.json({
      inserted: toInsert.length,
      skipped: errors.length,
      errors,
    });
  } catch (error) {
    console.error("[POST /api/applications/bulk]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
