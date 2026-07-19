import { createClient, Client } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL || 'file:sqllocal.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

// Global singleton client to reuse connections in Next.js dev server hot reload
const globalForDb = globalThis as unknown as {
  db: Client | undefined;
};

export const db = globalForDb.db ?? createClient({
  url,
  authToken,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
