import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculatePenaltyXP, getYesterdayDate, getFormattedDate } from '@/lib/xp';

export async function GET(req: NextRequest) {
  return handlePenaltyCheck();
}

export async function POST(req: NextRequest) {
  return handlePenaltyCheck();
}

async function handlePenaltyCheck() {
  try {
    const yesterdayStr = getYesterdayDate();
    const todayStr = getFormattedDate();

    // 1. Fetch all active habits created before today
    const habitsRes = await db.execute({
      sql: `
        SELECT 
          t.id as task_id,
          t.weight,
          t.category_id,
          t.title,
          COALESCE(s.current_streak, 0) as current_streak,
          s.last_completed_on
        FROM tasks t
        LEFT JOIN streaks s ON t.id = s.task_id
        WHERE t.is_active = 1 
          AND t.type = 'habit'
          AND date(t.created_at) < date('now')
      `,
      args: [],
    });

    const penalizedTasks: Array<{ taskId: number; title: string; penaltyXP: number }> = [];

    for (const habit of habitsRes.rows) {
      const taskId = Number(habit.task_id);
      const weight = Number(habit.weight);
      const categoryId = Number(habit.category_id);
      const title = String(habit.title);
      const lastCompletedOn = habit.last_completed_on ? String(habit.last_completed_on) : null;
      const currentStreak = Number(habit.current_streak);

      // If task was completed yesterday or today, it is not missed!
      if (lastCompletedOn === yesterdayStr || lastCompletedOn === todayStr) {
        continue;
      }

      // Also check if completion entry exists for yesterday
      const compRes = await db.execute({
        sql: 'SELECT 1 FROM completions WHERE task_id = ? AND completed_on = ?',
        args: [taskId, yesterdayStr],
      });

      if (compRes.rows.length > 0) {
        continue; // Was completed yesterday
      }

      // Task WAS missed yesterday! Apply penalty if streak was > 0 or penalty not already logged today for this task
      const penaltyCheckRes = await db.execute({
        sql: `
          SELECT 1 FROM xp_log 
          WHERE category_id = ? 
            AND reason = ? 
            AND date(logged_at) = date('now')
        `,
        args: [categoryId, `penalty_task_${taskId}`],
      });

      if (penaltyCheckRes.rows.length > 0) {
        continue; // Penalty already applied today
      }

      const penaltyXP = calculatePenaltyXP(weight);

      // Reset streak to 0
      await db.execute({
        sql: `
          INSERT INTO streaks (task_id, current_streak, longest_streak, last_completed_on)
          VALUES (?, 0, 0, ?)
          ON CONFLICT(task_id) DO UPDATE SET current_streak = 0
        `,
        args: [taskId, lastCompletedOn],
      });

      // Log penalty in xp_log
      await db.execute({
        sql: 'INSERT INTO xp_log (category_id, delta, reason, logged_at) VALUES (?, ?, ?, datetime("now"))',
        args: [categoryId, penaltyXP, `penalty: Missed habit "${title}"`],
      });

      penalizedTasks.push({ taskId, title, penaltyXP });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      penalizedCount: penalizedTasks.length,
      penalizedTasks,
    });
  } catch (error: any) {
    console.error('Error running penalty cron job:', error);
    return NextResponse.json({
      success: false,
      penalizedCount: 0,
      penalizedTasks: [],
      error: error?.message || String(error),
    });
  }
}
