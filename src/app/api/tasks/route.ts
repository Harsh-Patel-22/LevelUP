import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const sql = `
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        COALESCE(s.current_streak, 0) as current_streak,
        COALESCE(s.longest_streak, 0) as longest_streak,
        s.last_completed_on
      FROM tasks t
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN streaks s ON t.id = s.task_id
      ${includeInactive ? '' : 'WHERE t.is_active = 1'}
      ORDER BY t.created_at DESC
    `;

    const result = await db.execute(sql);
    return NextResponse.json({ tasks: result.rows });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ tasks: [], error: error?.message || String(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category_id, type, weight } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }
    if (!category_id) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (!['habit', 'priority'].includes(type)) {
      return NextResponse.json({ error: 'Type must be habit or priority' }, { status: 400 });
    }

    const taskWeight = Number(weight) || 2;
    if (taskWeight < 1 || taskWeight > 4) {
      return NextResponse.json({ error: 'Weight must be between 1 and 4' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'INSERT INTO tasks (title, category_id, type, weight, is_active) VALUES (?, ?, ?, ?, 1)',
      args: [title.trim(), category_id, type, taskWeight],
    });

    const taskId = Number(result.lastInsertRowid);

    // Initialize streaks entry if habit
    if (type === 'habit') {
      await db.execute({
        sql: 'INSERT OR IGNORE INTO streaks (task_id, current_streak, longest_streak) VALUES (?, 0, 0)',
        args: [taskId],
      });
    }

    const createdTask = await db.execute({
      sql: `
        SELECT 
          t.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          COALESCE(s.current_streak, 0) as current_streak,
          COALESCE(s.longest_streak, 0) as longest_streak
        FROM tasks t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN streaks s ON t.id = s.task_id
        WHERE t.id = ?
      `,
      args: [taskId],
    });

    return NextResponse.json({ task: createdTask.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
