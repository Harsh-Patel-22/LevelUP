import { createClient, Client } from '@libsql/client';

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

let localClient: Client | null = null;

function getLocalClient(): Client {
  if (!localClient) {
    localClient = createClient({
      url: process.env.VERCEL ? ':memory:' : 'file:sqllocal.db',
    });
  }
  return localClient;
}

function parseTursoPipelineResponse(data: any): { rows: any[]; lastInsertRowid?: number } {
  const execResult = data.results?.[0]?.response?.result;
  if (!execResult) return { rows: [] };

  const cols: string[] = (execResult.cols || []).map((c: any) => c.name);
  const rawRows: any[][] = execResult.rows || [];

  const rows = rawRows.map((rowArray) => {
    const rowObj: Record<string, any> = {};
    cols.forEach((colName, idx) => {
      const cell = rowArray[idx];
      if (!cell || cell.type === 'null' || cell.value === undefined || cell.value === null) {
        rowObj[colName] = null;
      } else if (cell.type === 'integer') {
        rowObj[colName] = Number(cell.value);
      } else if (cell.type === 'float') {
        rowObj[colName] = Number(cell.value);
      } else {
        rowObj[colName] = cell.value;
      }
    });
    return rowObj;
  });

  const lastInsertRowid = execResult.last_insert_rowid ? Number(execResult.last_insert_rowid) : undefined;
  return { rows, lastInsertRowid };
}

export async function executeQuery(sqlInput: string | { sql: string; args?: any[] }, argsInput: any[] = []) {
  const sql = typeof sqlInput === 'string' ? sqlInput : sqlInput.sql;
  const args = typeof sqlInput === 'string' ? argsInput : (sqlInput.args || []);

  if (tursoUrl && tursoToken) {
    // Direct Turso Cloud HTTPS Pipeline API (bypasses @libsql/client migration job interceptor)
    const httpUrl = tursoUrl.trim().replace(/^["']|["']$/g, '').replace('libsql://', 'https://').replace('http://', 'https://');
    const endpoint = `${httpUrl}/v2/pipeline`;
    const token = tursoToken.trim().replace(/^["']|["']$/g, '');

    const formattedArgs = args.map((val) => {
      if (val === null || val === undefined) return { type: 'null' };
      if (typeof val === 'number') return { type: 'integer', value: String(val) };
      return { type: 'text', value: String(val) };
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql,
              args: formattedArgs,
            },
          },
          { type: 'close' },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Turso HTTP Pipeline error (${res.status}): ${errText}`);
    }

    const json = await res.json();
    const parsed = parseTursoPipelineResponse(json);
    return {
      rows: parsed.rows,
      lastInsertRowid: parsed.lastInsertRowid,
      rowsAffected: json.results?.[0]?.response?.result?.affected_row_count || 0,
    };
  } else {
    // Local SQLite fallback
    const client = getLocalClient();
    const res = await client.execute({ sql, args });
    return {
      rows: res.rows.map((r: any) => {
        const obj: Record<string, any> = {};
        for (const [k, v] of Object.entries(r)) {
          obj[k] = typeof v === 'bigint' ? Number(v) : v;
        }
        return obj;
      }),
      lastInsertRowid: res.lastInsertRowid ? Number(res.lastInsertRowid) : undefined,
      rowsAffected: res.rowsAffected || 0,
    };
  }
}

export const db = {
  execute: (sql: any, args?: any[]) => executeQuery(sql, args),
};

export const queryDb = executeQuery;

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
