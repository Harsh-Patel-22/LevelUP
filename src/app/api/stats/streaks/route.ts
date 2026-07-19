import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT 
        s.task_id,
        t.title as task_title,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        s.current_streak,
        s.longest_streak,
        s.last_completed_on
      FROM streaks s
      JOIN tasks t ON s.task_id = t.id
      JOIN categories c ON t.category_id = c.id
      WHERE t.is_active = 1 AND t.type = 'habit'
      ORDER BY s.current_streak DESC, s.longest_streak DESC
    `);

    return NextResponse.json({ streaks: result.rows });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500 });
  }
}
