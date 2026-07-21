import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(10, Number(searchParams.get('limit')) || 50));

    const result = await db.execute({
      sql: `
        SELECT 
          l.id,
          l.delta,
          l.reason,
          l.logged_at,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color
        FROM xp_log l
        JOIN categories c ON l.category_id = c.id
        ORDER BY l.logged_at DESC, l.id DESC
        LIMIT ?
      `,
      args: [limit],
    });

    return NextResponse.json({ logs: result.rows });
  } catch (error: any) {
    console.error('Error fetching XP log:', error);
    return NextResponse.json({ logs: [], error: error?.message || String(error) });
  }
}
