import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

let rawUrl = process.env.TURSO_DATABASE_URL || 'file:sqllocal.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

// Normalize https:// to libsql:// to prevent @libsql/client from using buggy HttpClient migrations interceptor
if (rawUrl.startsWith('https://')) {
  rawUrl = rawUrl.replace('https://', 'libsql://');
}

const db = createClient({
  url: rawUrl,
  authToken,
});

async function executeStatement(sqlStr: string, argsArray: any[] = []) {
  // If remote Turso Cloud via HTTP/HTTPS, send raw pipeline request to bypass @libsql/client migration job check
  if (rawUrl.startsWith('libsql://') || rawUrl.startsWith('https://')) {
    const httpUrl = rawUrl.replace('libsql://', 'https://').replace('http://', 'https://');
    const endpoint = `${httpUrl}/v2/pipeline`;

    const formattedArgs = argsArray.map((val) => {
      if (typeof val === 'number') return { type: 'integer', value: String(val) };
      return { type: 'text', value: String(val) };
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            type: 'execute',
            stmt: {
              sql: sqlStr,
              args: formattedArgs,
            },
          },
          { type: 'close' },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Turso SQL Pipeline error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const resultReq = data.results?.[0]?.response?.result;
    return {
      rows: resultReq?.rows || [],
      rowsAffected: resultReq?.affected_row_count || 0,
    };
  } else {
    // Local SQLite file
    return db.execute({ sql: sqlStr, args: argsArray });
  }
}

async function main() {
  console.log('🔄 Running database migration...');

  const schemaPath = path.join(__dirname, '../src/lib/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Split schema into individual SQL statements
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await executeStatement(statement);
  }

  console.log('✅ Database schema created/verified.');

  // Seed default categories if empty
  const existingCategories = await executeStatement('SELECT COUNT(*) as count FROM categories');
  const count = Number(existingCategories.rows[0]?.count || 0);

  if (count === 0) {
    console.log('🌱 Seeding default categories...');
    const seedCategories = [
      { name: 'Coding', icon: '💻', color: '#4f8ef7' },
      { name: 'Health', icon: '⚔️', color: '#22d3ee' },
      { name: 'Learning', icon: '📚', color: '#7c3aed' },
      { name: 'Deep Work', icon: '🧠', color: '#f59e0b' },
      { name: 'Discipline', icon: '🔥', color: '#ef4444' },
    ];

    for (const cat of seedCategories) {
      await executeStatement('INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)', [
        cat.name,
        cat.icon,
        cat.color,
      ]);
    }
    console.log('✅ Seeded default categories.');
  }

  // Seed active Boss Raid if empty
  const existingBoss = await executeStatement('SELECT COUNT(*) as count FROM boss_raids');
  const bossCount = Number(existingBoss.rows[0]?.count || 0);

  if (bossCount === 0) {
    console.log('👹 Seeding default Weekly Boss Raid...');
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    await executeStatement(
      `INSERT INTO boss_raids (name, title, avatar, current_hp, max_hp, reward_xp, start_date, end_date, is_defeated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        'Blood-Red Commander Igris',
        'S-Rank Dungeon Boss',
        '⚔️',
        2000,
        2000,
        1000,
        todayStr,
        nextWeekStr,
      ]
    );
    console.log('✅ Seeded Boss Raid: Igris the Red-Blood Knight.');
  }

  console.log('🎉 Migration completed successfully!');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
