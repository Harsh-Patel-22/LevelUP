import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = Number(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const body = await req.json();
    const { title, category_id, weight, is_active } = body;

    const updates: string[] = [];
    const args: any[] = [];

    if (title !== undefined && title.trim()) {
      updates.push('title = ?');
      args.push(title.trim());
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      args.push(category_id);
    }
    if (weight !== undefined) {
      const w = Number(weight);
      if (w >= 1 && w <= 4) {
        updates.push('weight = ?');
        args.push(w);
      }
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      args.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    args.push(taskId);

    await db.execute({
      sql: `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      args,
    });

    const updated = await db.execute({
      sql: `
        SELECT 
          t.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          COALESCE(s.current_streak, 0) as current_streak
        FROM tasks t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN streaks s ON t.id = s.task_id
        WHERE t.id = ?
      `,
      args: [taskId],
    });

    return NextResponse.json({ task: updated.rows[0] });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = Number(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Soft delete
    await db.execute({
      sql: 'UPDATE tasks SET is_active = 0 WHERE id = ?',
      args: [taskId],
    });

    return NextResponse.json({ success: true, message: 'Task archived' });
  } catch (error) {
    console.error('Error archiving task:', error);
    return NextResponse.json({ error: 'Failed to archive task' }, { status: 500 });
  }
}
