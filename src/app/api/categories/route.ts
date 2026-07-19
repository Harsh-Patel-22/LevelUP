import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT c.*, 
        COALESCE((SELECT SUM(delta) FROM xp_log WHERE category_id = c.id), 0) as total_xp,
        (SELECT COUNT(*) FROM tasks WHERE category_id = c.id AND is_active = 1) as active_tasks_count
      FROM categories c
      ORDER BY c.name ASC
    `);

    return NextResponse.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
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
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
