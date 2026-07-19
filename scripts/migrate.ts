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

  console.log('🎉 Migration completed successfully!');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
