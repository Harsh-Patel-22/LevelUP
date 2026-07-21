'use client';

import { RankInfo } from '@/lib/xp';
import { Award, Flame, Zap } from 'lucide-react';

interface PlayerCardProps {
  rank?: RankInfo;
  totalXP?: number;
  activeStreaksCount?: number;
  loading?: boolean;
}

export default function PlayerCard({ rank, totalXP = 0, activeStreaksCount = 0, loading }: PlayerCardProps) {
  if (loading) {
    return (
      <div className="system-panel rounded-xl p-6 animate-pulse flex items-center justify-between">
        <div className="h-16 bg-surface-border/50 rounded w-1/3"></div>
        <div className="h-16 bg-surface-border/50 rounded w-1/3"></div>
      </div>
    );
  }

  const safeRank = rank || {
    rank: 'E',
    title: 'E-Rank Awakened (The Weakest)',
    minXP: 0,
    nextRankMinXP: 1000,
    color: '#94a3b8',
  };

  const safeXP = Math.max(0, Number(totalXP || 0));

  // Calculate percentage to next rank
  let nextRankProgress = 100;
  if (safeRank.nextRankMinXP !== null && safeRank.nextRankMinXP > safeRank.minXP) {
    const xpInRankRange = safeXP - safeRank.minXP;
    const rankRangeTotal = safeRank.nextRankMinXP - safeRank.minXP;
    nextRankProgress = Math.min(100, Math.max(0, (xpInRankRange / rankRangeTotal) * 100));
  }

  return (
    <div className="system-panel-glow rounded-xl p-5 sm:p-6 relative overflow-hidden">
      {/* Background RPG Accent Lines */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-solo-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-solo-violet/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left: Rank Badge & Title */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center font-orbitron font-black text-2xl sm:text-3xl shrink-0 rank-badge-${safeRank.rank}`}
          >
            {safeRank.rank}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-rajdhani font-extrabold uppercase tracking-widest text-solo-cyan bg-solo-cyan/10 px-2 py-0.5 rounded border border-solo-cyan/20">
                PLAYER STATUS
              </span>
              <span className="flex items-center gap-1 text-[11px] font-rajdhani text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SYSTEM ONLINE
              </span>
            </div>

            <h2 className="font-orbitron font-extrabold text-xl sm:text-2xl text-text-primary mt-1">
              {safeRank.title}
            </h2>

            <div className="flex items-center gap-4 mt-2 text-xs font-rajdhani font-semibold text-text-muted">
              <span className="flex items-center gap-1.5 text-solo-gold">
                <Award className="w-4 h-4" />
                Rank Tier: <strong className="text-text-primary">{safeRank.rank}-Rank</strong>
              </span>
              <span className="flex items-center gap-1.5 text-solo-cyan">
                <Flame className="w-4 h-4" />
                Active Streaks: <strong className="text-text-primary">{activeStreaksCount}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Total XP & Progress to Next Rank */}
        <div className="flex flex-col justify-center bg-surface/80 rounded-lg p-4 border border-surface-border min-w-[240px]">
          <div className="flex items-center justify-between gap-3 text-xs font-rajdhani font-bold mb-1.5">
            <span className="text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-solo-cyan" />
              Total System XP
            </span>
            <span className="font-orbitron text-solo-cyan text-base font-bold">
              {safeXP.toLocaleString()} <span className="text-xs font-normal text-text-muted">XP</span>
            </span>
          </div>

          {/* Progress Bar to next rank */}
          <div className="w-full bg-surface-border h-2.5 rounded-full overflow-hidden p-0.5 border border-surface-border">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-solo-blue via-solo-cyan to-solo-violet"
              style={{ width: `${nextRankProgress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-rajdhani font-semibold text-text-muted mt-1.5">
            <span>Current: {safeXP.toLocaleString()} XP</span>
            <span>
              {safeRank.nextRankMinXP !== null ? (
                <>Next Rank: {safeRank.nextRankMinXP.toLocaleString()} XP</>
              ) : (
                'MAX RANK REACHED'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
