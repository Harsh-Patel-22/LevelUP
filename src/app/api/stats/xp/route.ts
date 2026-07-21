import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { queryDb, safeSerialize } from '@/lib/db';
import { calculateCategoryLevel, getOverallRank } from '@/lib/xp';

export async function GET() {
  try {
    // 1. Category Breakdown
    const catResult = await queryDb(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        COALESCE(SUM(l.delta), 0) as total_xp
      FROM categories c
      LEFT JOIN xp_log l ON c.id = l.category_id
      GROUP BY c.id
      ORDER BY total_xp DESC
    `);

    let totalPlayerXP = 0;

    const categoriesWithLevels = catResult.rows.map((row) => {
      const categoryXP = Number(row.total_xp);
      totalPlayerXP += categoryXP;
      const levelProgress = calculateCategoryLevel(categoryXP);

      return {
        id: Number(row.id),
        name: String(row.name),
        icon: String(row.icon || '⚡'),
        color: String(row.color || '#4f8ef7'),
        total_xp: categoryXP,
        level: levelProgress.level,
        currentLevelXP: levelProgress.currentLevelXP,
        xpForNextLevel: levelProgress.xpForNextLevel,
        progressPercent: levelProgress.progressPercent,
      };
    });

    const rankInfo = getOverallRank(totalPlayerXP);

    return NextResponse.json(
      safeSerialize({
        totalXP: totalPlayerXP,
        rank: rankInfo,
        categories: categoriesWithLevels,
      })
    );
  } catch (error: any) {
    console.error('Error fetching XP stats:', error);
    return NextResponse.json({
      totalXP: 0,
      rank: getOverallRank(0),
      categories: [],
      error: error?.message || String(error),
    });
  }
}
