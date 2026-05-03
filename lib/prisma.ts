// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

if (!process.env.DATABASE_URL?.trim() && process.env.MYSQL_URL?.trim()) {
  process.env.DATABASE_URL = process.env.MYSQL_URL;
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // optional (for debugging)
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
