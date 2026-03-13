/**
 * Seeds LeetCode problems into the database from data/neetcode_150_full.json.
 * Safe to re-run — uses upsert so existing problems are updated, not duplicated.
 * Run: npx ts-node prisma/seed-problems.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ProblemEntry {
  slug: string;
  title: string;
  difficulty: string;
  topic: string;
}

async function main() {
  const filePath = path.join(process.cwd(), "data", "neetcode_150_full.json");
  const problems: ProblemEntry[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  console.log(`🌱 Seeding ${problems.length} NeetCode problems…`);

  let upserted = 0;
  for (const p of problems) {
    await prisma.problem.upsert({
      where: { slug: p.slug },
      update: { title: p.title, difficulty: p.difficulty, topic: p.topic },
      create: { slug: p.slug, title: p.title, difficulty: p.difficulty, topic: p.topic, source: "NeetCode" },
    });
    upserted++;
  }

  console.log(`✅ Upserted ${upserted} problems`);
}

main()
  .catch((e) => {
    console.error("❌ Problem seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
