// Server-only Prisma client. One instance per process (reused across hot reloads in dev).
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function runtimeDatabaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value) return undefined;

  // Supabase Transaction Pooler uses PgBouncer in transaction mode. Prisma
  // must disable prepared statements for that connection or requests can
  // fail with "prepared statement already exists" in serverless runtimes.
  try {
    const url = new URL(value);
    if (url.port === "6543" && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return value;
  }
}

const clientOptions = runtimeDatabaseUrl()
  ? { datasources: { db: { url: runtimeDatabaseUrl() } } }
  : undefined;

export const db = globalForPrisma.prisma ?? new PrismaClient(clientOptions);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
