/**
 * Seed script — creates one demo user with sample job applications.
 * Run: npm run db:seed
 *
 * Demo credentials:
 *   Email:    demo@example.com
 *   Password: password123
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean up existing seed data
  await prisma.application.deleteMany({});
  await prisma.user.deleteMany({});

  const hashedPassword = await bcrypt.hash("password123", 12);

  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User",
      password: hashedPassword,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  const applications = await prisma.application.createMany({
    data: [
      {
        userId: user.id,
        jobTitle: "Senior Frontend Engineer",
        company: "Stripe",
        location: "San Francisco, CA (Remote)",
        dateApplied: new Date("2026-02-10"),
        status: "INTERVIEWING",
        notes: "Had a great first call with the recruiter. Technical screen scheduled for next week.",
        jobDescription:
          "We are looking for a Senior Frontend Engineer to join our team. You will be responsible for building and maintaining our web applications using React and TypeScript.",
        jobLink: "https://stripe.com/jobs",
        salary: "$180,000 - $220,000",
        recruiterContact: "sarah@stripe.com",
      },
      {
        userId: user.id,
        jobTitle: "Full Stack Developer",
        company: "Linear",
        location: "Remote",
        dateApplied: new Date("2026-02-15"),
        status: "APPLIED",
        notes: "Applied via their careers page. Waiting to hear back.",
        jobDescription:
          "Join our small but mighty engineering team. We value craftsmanship, speed, and quality. You'll work across the entire stack.",
        jobLink: "https://linear.app/careers",
        salary: "$160,000 - $200,000",
      },
      {
        userId: user.id,
        jobTitle: "Software Engineer II",
        company: "Notion",
        location: "New York, NY",
        dateApplied: new Date("2026-01-28"),
        status: "DENIED",
        notes: "Received rejection email. They went with someone with more backend experience.",
        jobDescription:
          "Build features used by millions of people every day. Work on everything from database performance to pixel-perfect UI.",
        salary: "$150,000 - $190,000",
      },
      {
        userId: user.id,
        jobTitle: "React Engineer",
        company: "Vercel",
        location: "Remote",
        dateApplied: new Date("2026-02-20"),
        status: "APPLIED",
        notes: "Excited about this one — love their products.",
        jobLink: "https://vercel.com/careers",
        salary: "$170,000 - $210,000",
      },
      {
        userId: user.id,
        jobTitle: "Frontend Architect",
        company: "Figma",
        location: "San Francisco, CA",
        dateApplied: new Date("2026-02-05"),
        status: "INTERVIEWING",
        notes: "Passed the take-home project. Final round with the VP of Engineering next week.",
        jobDescription:
          "Help define the future of design tooling. Own large architectural decisions across our React-based editor.",
        salary: "$200,000 - $250,000",
        recruiterContact: "mike.recruiter@figma.com",
      },
      {
        userId: user.id,
        jobTitle: "TypeScript Engineer",
        company: "Prisma",
        location: "Remote",
        dateApplied: new Date("2026-03-01"),
        status: "APPLIED",
        notes: "",
        jobLink: "https://prisma.io/careers",
      },
    ],
  });

  console.log(`✅ Created ${applications.count} applications`);
  console.log("\n📋 Demo credentials:");
  console.log("   Email:    demo@example.com");
  console.log("   Password: password123");
  console.log("\n✨ Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
