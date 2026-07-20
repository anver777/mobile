import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/**
 * Lazy database proxy.
 * The actual connection pool is created only on first method call,
 * so Next.js static builds succeed without DATABASE_URL.
 */

let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

function ensureDb(): NodePgDatabase {
  if (_db) return _db;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Add it to your .env or deployment environment."
    );
  }

  const globalForDb = globalThis as typeof globalThis & {
    __arenaNextJsPostgresqlPool?: Pool;
  };

  _pool = globalForDb.__arenaNextJsPostgresqlPool ?? new Pool({ connectionString: databaseUrl });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = _pool;
  }

  _db = drizzle(_pool);
  return _db;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as any, {
  get(_target, prop) {
    const real = ensureDb();
    const key = String(prop);
    const value = (real as any)[key];
    if (typeof value === "function") {
      return (...args: unknown[]) => value.apply(real, args);
    }
    return value;
  },
});

export function getPool(): Pool {
  if (_pool) return _pool;
  void ensureDb();
  return _pool!;
}
