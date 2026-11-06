import { PrismaClient } from "@prisma/client";
import { fixDbUrl } from "./db-url";

const g = globalThis as unknown as { prisma?: PrismaClient };
const url = fixDbUrl(process.env.DATABASE_URL);
export const prisma = g.prisma ?? new PrismaClient(url ? { datasourceUrl: url } : undefined);
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
