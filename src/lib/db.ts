import { createClient, Client } from '@libsql/client';

function getClient(): Client {
  let url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    url = process.env.VERCEL ? ':memory:' : 'file:sqllocal.db';
  } else {
    url = url.trim().replace(/^["']|["']$/g, '');
    if (url.startsWith('libsql://')) {
      url = url.replace('libsql://', 'https://');
    }
  }

  return createClient({
    url,
    authToken: authToken ? authToken.trim().replace(/^["']|["']$/g, '') : undefined,
  });
}

const globalForDb = globalThis as unknown as {
  db: Client | undefined;
};

export const db = globalForDb.db ?? getClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

/**
 * Safely converts BigInt values to Numbers so JSON.stringify / NextResponse.json does not throw TypeError!
 */
export function safeSerialize<T = any>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(safeSerialize) as unknown as T;
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      res[key] = safeSerialize((obj as any)[key]);
    }
    return res as T;
  }
  return obj;
}

/**
 * Wrapper function around db.execute that automatically serializes BigInt fields to Numbers for JSON response safety
 */
export async function queryDb(sql: string | { sql: string; args?: any[] }, args: any[] = []) {
  const stmt = typeof sql === 'string' ? { sql, args } : { sql: sql.sql, args: sql.args || [] };
  const res = await db.execute(stmt);
  return {
    ...res,
    rows: safeSerialize(res.rows),
  };
}
