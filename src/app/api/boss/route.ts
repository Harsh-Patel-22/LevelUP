import { NextRequest, NextResponse } from 'next/server';
import { queryDb, safeSerialize, db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await queryDb(`
      SELECT * FROM boss_raids
      ORDER BY id DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      return NextResponse.json({ boss: null });
    }

    return NextResponse.json({ boss: safeSerialize(result.rows[0]) });
  } catch (error: any) {
    console.error('Error fetching boss raid:', error);
    return NextResponse.json({ boss: null, error: error?.message || String(error) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const damage = Math.max(1, Number(body.damage) || 0);

    const activeBossRes = await db.execute(`
      SELECT * FROM boss_raids WHERE is_defeated = 0 ORDER BY id DESC LIMIT 1
    `);

    if (activeBossRes.rows.length === 0) {
      return NextResponse.json({ message: 'No active boss raid' });
    }

    const boss = activeBossRes.rows[0];
    const bossId = Number(boss.id);
    const curHP = Number(boss.current_hp);
    const rewardXP = Number(boss.reward_xp);

    const newHP = Math.max(0, curHP - damage);
    const isDefeated = newHP === 0 ? 1 : 0;

    await db.execute({
      sql: 'UPDATE boss_raids SET current_hp = ?, is_defeated = ? WHERE id = ?',
      args: [newHP, isDefeated, bossId],
    });

    // If boss just defeated, award bonus reward XP to first category
    if (isDefeated === 1 && curHP > 0) {
      const catRes = await db.execute('SELECT id FROM categories LIMIT 1');
      const catId = Number(catRes.rows[0]?.id || 1);
      await db.execute({
        sql: 'INSERT INTO xp_log (category_id, delta, reason, logged_at) VALUES (?, ?, ?, datetime("now"))',
        args: [catId, rewardXP, `Boss Defeated: ${boss.name}`],
      });
    }

    return NextResponse.json({
      success: true,
      damageDealt: damage,
      newHP,
      isDefeated: isDefeated === 1,
      rewardXP: isDefeated === 1 ? rewardXP : 0,
    });
  } catch (error) {
    console.error('Error dealing boss damage:', error);
    return NextResponse.json({ error: 'Failed to damage boss' }, { status: 500 });
  }
}
