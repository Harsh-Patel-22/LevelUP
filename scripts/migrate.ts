import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL || 'file:sqllocal.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const db = createClient({
  url,
  authToken,
});

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
    await db.execute(statement);
  }

  console.log('✅ Database schema created/verified.');

  // Seed default categories if empty
  const existingCategories = await db.execute('SELECT COUNT(*) as count FROM categories');
  const count = Number(existingCategories.rows[0].count);

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
      await db.execute({
        sql: 'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
        args: [cat.name, cat.icon, cat.color],
      });
    }
    console.log('✅ Seeded default categories.');
  }

  // Seed active Boss Raid if empty
  const existingBoss = await db.execute('SELECT COUNT(*) as count FROM boss_raids');
  const bossCount = Number(existingBoss.rows[0].count);

  if (bossCount === 0) {
    console.log('👹 Seeding default Weekly Boss Raid...');
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    await db.execute({
      sql: `
        INSERT INTO boss_raids (name, title, avatar, current_hp, max_hp, reward_xp, start_date, end_date, is_defeated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
      `,
      args: [
        'Blood-Red Commander Igris',
        'S-Rank Dungeon Boss',
        '⚔️',
        2000,
        2000,
        1000,
        todayStr,
        nextWeekStr,
      ],
    });
    console.log('✅ Seeded Boss Raid: Igris the Red-Blood Knight.');
  }

  console.log('🎉 Migration completed successfully!');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
