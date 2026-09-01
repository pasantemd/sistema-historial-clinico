import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalPrisma = globalThis as unknown as { prisma?: PrismaClient };

function crearClientePrisma() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL no está definida.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

export const prisma = globalPrisma.prisma ?? crearClientePrisma();

if (process.env.NODE_ENV !== "production") {
  globalPrisma.prisma = prisma;
}
