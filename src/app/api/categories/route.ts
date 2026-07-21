import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { queryDb, safeSerialize, db } from '@/lib/db';

export async function GET() {
  try {
    if (!process.env.TURSO_DATABASE_URL && process.env.VERCEL) {
      return NextResponse.json({
        categories: [],
        error: 'TURSO_DATABASE_URL environment variable is missing on Vercel. Please add TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel Project Settings.',
      });
    }

    const result = await queryDb(`
      SELECT c.*, 
        COALESCE((SELECT SUM(delta) FROM xp_log WHERE category_id = c.id), 0) as total_xp,
        (SELECT COUNT(*) FROM tasks WHERE category_id = c.id AND is_active = 1) as active_tasks_count
      FROM categories c
      ORDER BY c.name ASC
    `);

    return NextResponse.json({ categories: safeSerialize(result.rows) });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({
      categories: [],
      error: error?.message || String(error),
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, icon, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const categoryIcon = icon || '⚡';
    const categoryColor = color || '#4f8ef7';

    const result = await db.execute({
      sql: 'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?)',
      args: [name.trim(), categoryIcon, categoryColor],
    });

    const newCategory = await db.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [result.lastInsertRowid!],
    });

    return NextResponse.json({ category: newCategory.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 400 });
  }
}
