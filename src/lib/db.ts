import { createClient, Client } from '@libsql/client';

function getClient(): Client {
  let url = process.env.TURSO_DATABASE_URL || 'file:sqllocal.db';
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  // Convert libsql:// to https:// for Vercel Serverless HTTP fetch compatibility
  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://');
  }

  return createClient({
    url,
    authToken,
  });
}

const globalForDb = globalThis as unknown as {
  db: Client | undefined;
};

export const db = globalForDb.db ?? getClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
