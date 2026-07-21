import { createClient, Client } from '@libsql/client';

let url = process.env.TURSO_DATABASE_URL || 'file:sqllocal.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

// Automatically normalize https:// to libsql:// for @libsql/client compatibility
if (url.startsWith('https://')) {
  url = url.replace('https://', 'libsql://');
}

const globalForDb = globalThis as unknown as {
  db: Client | undefined;
};

export const db =
  globalForDb.db ??
  createClient({
    url,
    authToken,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
