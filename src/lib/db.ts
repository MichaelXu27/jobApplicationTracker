/**
 * Prisma client singleton.
 *
 * Next.js hot-reload in dev creates a new module scope on each reload,
 * which would exhaust the connection pool. We store the client on the
 * Node.js global object so it is reused across hot reloads.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
