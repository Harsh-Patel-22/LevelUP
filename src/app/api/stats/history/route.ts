import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import { getFormattedDate } from '@/lib/xp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(90, Math.max(7, Number(searchParams.get('days')) || 30));

    // Generate date range
    const historyData: Array<{ date: string; xp: number; label: string }> = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getFormattedDate(d);
      const labelStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      historyData.push({ date: dateStr, xp: 0, label: labelStr });
    }

    // Query aggregated XP by date from xp_log
    const dateMap = new Map<string, number>();

    const result = await db.execute({
      sql: `
        SELECT 
          substr(logged_at, 1, 10) as date_str,
          SUM(delta) as daily_xp
        FROM xp_log
        WHERE logged_at >= date('now', '-' || ? || ' days')
        GROUP BY date_str
      `,
      args: [days],
    });

    for (const row of result.rows) {
      dateMap.set(String(row.date_str), Number(row.daily_xp));
    }

    const formattedHistory = historyData.map((item) => ({
      ...item,
      xp: dateMap.get(item.date) || 0,
    }));

    return NextResponse.json({ history: formattedHistory });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ history: [], error: error?.message || String(error) });
  }
}
