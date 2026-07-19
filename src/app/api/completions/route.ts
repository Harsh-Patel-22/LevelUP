import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { db } from '@/lib/db';
import {
  calculateTaskXP,
  calculateCategoryLevel,
  getFormattedDate,
  getYesterdayDate,
} from '@/lib/xp';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date') || getFormattedDate();

    const result = await db.execute({
      sql: `
        SELECT 
          c.*,
          t.title as task_title,
          t.type as task_type,
          t.category_id
        FROM completions c
        JOIN tasks t ON c.task_id = t.id
        WHERE c.completed_on = ?
      `,
      args: [dateParam],
    });

    return NextResponse.json({ completions: result.rows });
  } catch (error) {
    console.error('Error fetching completions:', error);
    return NextResponse.json({ error: 'Failed to fetch completions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { task_id, date } = body;

    const taskId = Number(task_id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const completedOn = date || getFormattedDate();
    const yesterdayStr = getYesterdayDate(new Date(completedOn));

    // 1. Fetch task and category details
    const taskRes = await db.execute({
      sql: `
        SELECT t.*, c.name as category_name 
        FROM tasks t 
        JOIN categories c ON t.category_id = c.id 
        WHERE t.id = ?
      `,
      args: [taskId],
    });

    if (taskRes.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = taskRes.rows[0];
    const categoryId = Number(task.category_id);
    const categoryName = String(task.category_name);
    const weight = Number(task.weight);
    const taskType = String(task.type) as 'habit' | 'priority';

    // 2. Check if already completed on this date
    const existingComp = await db.execute({
      sql: 'SELECT * FROM completions WHERE task_id = ? AND completed_on = ?',
      args: [taskId, completedOn],
    });

    if (existingComp.rows.length > 0) {
      return NextResponse.json(
        { error: 'Task already completed for this date' },
        { status: 400 }
      );
    }

    // 3. Calculate category total XP before this completion
    const preXpRes = await db.execute({
      sql: 'SELECT COALESCE(SUM(delta), 0) as total_xp FROM xp_log WHERE category_id = ?',
      args: [categoryId],
    });
    const preXP = Number(preXpRes.rows[0].total_xp);
    const levelBefore = calculateCategoryLevel(preXP).level;

    // 4. Determine Streak
    let newStreak = 1;
    let longestStreak = 1;

    if (taskType === 'habit') {
      const streakRes = await db.execute({
        sql: 'SELECT * FROM streaks WHERE task_id = ?',
        args: [taskId],
      });

      if (streakRes.rows.length > 0) {
        const streakRow = streakRes.rows[0];
        const curStreak = Number(streakRow.current_streak);
        const lastComp = streakRow.last_completed_on ? String(streakRow.last_completed_on) : null;
        const prevLongest = Number(streakRow.longest_streak);

        if (lastComp === yesterdayStr) {
          newStreak = curStreak + 1;
        } else if (lastComp === completedOn) {
          newStreak = curStreak; // same day repeat edge case
        } else {
          newStreak = 1; // streak reset
        }

        longestStreak = Math.max(prevLongest, newStreak);
      }
    }

    // 5. Calculate XP
    const xpEarned = calculateTaskXP(weight, taskType, newStreak);

    // 6. Database updates
    await db.execute({
      sql: 'INSERT INTO completions (task_id, completed_on, xp_earned, streak_at_completion) VALUES (?, ?, ?, ?)',
      args: [taskId, completedOn, xpEarned, newStreak],
    });

    if (taskType === 'habit') {
      await db.execute({
        sql: `
          INSERT INTO streaks (task_id, current_streak, longest_streak, last_completed_on)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(task_id) DO UPDATE SET
            current_streak = excluded.current_streak,
            longest_streak = excluded.longest_streak,
            last_completed_on = excluded.last_completed_on
        `,
        args: [taskId, newStreak, longestStreak, completedOn],
      });
    }

    await db.execute({
      sql: 'INSERT INTO xp_log (category_id, delta, reason, logged_at) VALUES (?, ?, ?, datetime("now"))',
      args: [categoryId, xpEarned, 'task_complete'],
    });

    // 7. Check if leveled up
    const postXpRes = await db.execute({
      sql: 'SELECT COALESCE(SUM(delta), 0) as total_xp FROM xp_log WHERE category_id = ?',
      args: [categoryId],
    });
    const postXP = Number(postXpRes.rows[0].total_xp);
    const levelAfter = calculateCategoryLevel(postXP).level;
    const leveledUp = levelAfter > levelBefore;

    return NextResponse.json({
      success: true,
      completion: {
        task_id: taskId,
        completed_on: completedOn,
        xp_earned: xpEarned,
        streak_at_completion: newStreak,
      },
      xpEarned,
      newStreak,
      leveledUp,
      levelBefore,
      newLevel: levelAfter,
      categoryName,
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = Number(searchParams.get('task_id'));
    const dateParam = searchParams.get('date') || getFormattedDate();

    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Fetch completion record
    const compRes = await db.execute({
      sql: 'SELECT * FROM completions WHERE task_id = ? AND completed_on = ?',
      args: [taskId, dateParam],
    });

    if (compRes.rows.length === 0) {
      return NextResponse.json({ error: 'Completion not found' }, { status: 404 });
    }

    const completion = compRes.rows[0];
    const xpEarned = Number(completion.xp_earned);

    // Fetch task category
    const taskRes = await db.execute({
      sql: 'SELECT category_id, type FROM tasks WHERE id = ?',
      args: [taskId],
    });
    const categoryId = Number(taskRes.rows[0].category_id);
    const taskType = String(taskRes.rows[0].type);

    // Delete completion
    await db.execute({
      sql: 'DELETE FROM completions WHERE task_id = ? AND completed_on = ?',
      args: [taskId, dateParam],
    });

    // Revert XP in log by adding a negative delta or removing last task_complete log
    await db.execute({
      sql: 'INSERT INTO xp_log (category_id, delta, reason, logged_at) VALUES (?, ?, ?, datetime("now"))',
      args: [categoryId, -xpEarned, 'undo_completion'],
    });

    // Revert streak
    if (taskType === 'habit') {
      const streakRes = await db.execute({
        sql: 'SELECT current_streak FROM streaks WHERE task_id = ?',
        args: [taskId],
      });
      if (streakRes.rows.length > 0) {
        const curStreak = Number(streakRes.rows[0].current_streak);
        const prevStreak = Math.max(0, curStreak - 1);
        await db.execute({
          sql: 'UPDATE streaks SET current_streak = ? WHERE task_id = ?',
          args: [prevStreak, taskId],
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Completion reverted' });
  } catch (error) {
    console.error('Error undoing completion:', error);
    return NextResponse.json({ error: 'Failed to undo completion' }, { status: 500 });
  }
}
