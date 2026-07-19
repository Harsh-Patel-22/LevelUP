export interface LevelProgress {
  level: number;
  totalXP: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  progressPercent: number;
}

export interface RankInfo {
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS';
  title: string;
  minXP: number;
  nextRankMinXP: number | null;
  color: string;
}

/**
 * Get base XP for task weight
 */
export function getBaseXP(weight: number): number {
  switch (weight) {
    case 1:
      return 10;
    case 2:
      return 25;
    case 3:
      return 50;
    case 4:
      return 100;
    default:
      return 25;
  }
}

/**
 * Get streak multiplier based on current streak count
 */
export function getStreakMultiplier(streak: number): number {
  if (streak >= 30) return 2.0;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.2;
  return 1.0;
}

/**
 * Calculate final XP earned for task completion
 */
export function calculateTaskXP(weight: number, type: 'habit' | 'priority', streak: number): number {
  const baseXP = getBaseXP(weight);
  if (type === 'priority') {
    return baseXP; // No streak multiplier for priorities
  }
  const multiplier = getStreakMultiplier(streak);
  return Math.round(baseXP * multiplier);
}

/**
 * Calculate streak failure penalty
 * Penalty is -50% of task's base XP, capped at max -100 XP per miss
 */
export function calculatePenaltyXP(weight: number): number {
  const baseXP = getBaseXP(weight);
  const penalty = Math.round(baseXP * 0.5);
  return -Math.min(penalty, 100);
}

/**
 * Calculate category level from category total XP
 * Level = floor(sqrt(Total Category XP / 50))
 */
export function calculateCategoryLevel(totalXP: number): LevelProgress {
  const validXP = Math.max(0, totalXP);
  const level = Math.floor(Math.sqrt(validXP / 50));
  
  const xpFloorCurrentLevel = 50 * Math.pow(level, 2);
  const xpFloorNextLevel = 50 * Math.pow(level + 1, 2);
  
  const currentLevelXP = validXP - xpFloorCurrentLevel;
  const xpForNextLevel = xpFloorNextLevel - xpFloorCurrentLevel;
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXP / xpForNextLevel) * 100));

  return {
    level,
    totalXP: validXP,
    currentLevelXP,
    xpForNextLevel,
    progressPercent: Math.round(progressPercent * 10) / 10,
  };
}

/**
 * Get overall player rank based on total aggregate XP
 */
export function getOverallRank(totalXP: number): RankInfo {
  const validXP = Math.max(0, totalXP);

  if (validXP >= 250000) {
    return {
      rank: 'SS',
      title: 'Monarch / Shadow Sovereign',
      minXP: 250000,
      nextRankMinXP: null,
      color: '#f59e0b', // Gold
    };
  }
  if (validXP >= 100000) {
    return {
      rank: 'S',
      title: 'National Level Hunter',
      minXP: 100000,
      nextRankMinXP: 250000,
      color: '#ef4444', // Red / Crimson
    };
  }
  if (validXP >= 40000) {
    return {
      rank: 'A',
      title: 'High Rank Hunter',
      minXP: 40000,
      nextRankMinXP: 100000,
      color: '#7c3aed', // Violet
    };
  }
  if (validXP >= 15000) {
    return {
      rank: 'B',
      title: 'Veteran Hunter',
      minXP: 15000,
      nextRankMinXP: 40000,
      color: '#4f8ef7', // Electric Blue
    };
  }
  if (validXP >= 5000) {
    return {
      rank: 'C',
      title: 'Intermediate Hunter',
      minXP: 5000,
      nextRankMinXP: 15000,
      color: '#22d3ee', // Cyan
    };
  }
  if (validXP >= 1000) {
    return {
      rank: 'D',
      title: 'Novice Hunter',
      minXP: 1000,
      nextRankMinXP: 5000,
      color: '#10b981', // Emerald Green
    };
  }
  return {
    rank: 'E',
    title: 'E-Rank Awakened (The Weakest)',
    minXP: 0,
    nextRankMinXP: 1000,
    color: '#94a3b8', // Slate Gray
  };
}

/**
 * Get date string formatted as YYYY-MM-DD in local time
 */
export function getFormattedDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date string YYYY-MM-DD
 */
export function getYesterdayDate(date: Date = new Date()): string {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return getFormattedDate(yesterday);
}
