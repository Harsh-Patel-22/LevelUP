'use client';

import { useEffect, useState } from 'react';
import PlayerCard from '@/components/PlayerCard';
import { RankInfo, getOverallRank } from '@/lib/xp';
import { BarChart3, Layers, Flame, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface CategoryLevelStat {
  id: number;
  name: string;
  icon: string;
  color: string;
  total_xp: number;
  level: number;
  currentLevelXP: number;
  xpForNextLevel: number;
  progressPercent: number;
}

interface StreakItem {
  task_id: number;
  task_title: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  current_streak: number;
  longest_streak: number;
}

interface HistoryItem {
  date: string;
  xp: number;
  label: string;
}

export default function StatsPage() {
  const [totalXP, setTotalXP] = useState(0);
  const [rankInfo, setRankInfo] = useState<RankInfo>(getOverallRank(0));
  const [categories, setCategories] = useState<CategoryLevelStat[]>([]);
  const [streaks, setStreaks] = useState<StreakItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [daysFilter, setDaysFilter] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [xpRes, streakRes, historyRes] = await Promise.all([
          fetch('/api/stats/xp'),
          fetch('/api/stats/streaks'),
          fetch(`/api/stats/history?days=${daysFilter}`),
        ]);

        const xpData = await xpRes.json();
        const streakData = await streakRes.json();
        const historyData = await historyRes.json();

        setTotalXP(xpData.totalXP || 0);
        if (xpData.rank) setRankInfo(xpData.rank);
        setCategories(xpData.categories || []);
        setStreaks(streakData.streaks || []);
        setHistory(historyData.history || []);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [daysFilter]);

  return (
    <div className="space-y-8">
      {/* Status Header */}
      <PlayerCard rank={rankInfo} totalXP={totalXP} activeStreaksCount={streaks.length} loading={loading} />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Category Skill Domain Levels + Daily Graph */}
        <div className="lg:col-span-2 space-y-8">
          {/* Skill Domain Levels */}
          <div className="system-panel rounded-xl p-6 border-solo-blue/30 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-solo-cyan" />
                <h2 className="font-orbitron font-extrabold text-xl text-text-primary">
                  Skill Domain Levels
                </h2>
              </div>
              <span className="text-xs font-rajdhani text-text-muted font-bold">
                Formula: Level = ⌊√(XP / 50)⌋
              </span>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-surface-border/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-xs font-rajdhani text-text-muted py-4 text-center">
                No categories available.
              </p>
            ) : (
              <div className="space-y-5">
                {categories.map((cat) => (
                  <div key={cat.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.icon}</span>
                        <span className="font-orbitron font-bold text-sm text-text-primary">
                          {cat.name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-orbitron font-extrabold"
                          style={{
                            backgroundColor: `${cat.color}20`,
                            color: cat.color,
                            border: `1px solid ${cat.color}40`,
                          }}
                        >
                          LV. {cat.level}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-orbitron font-bold text-xs text-solo-cyan">
                          {cat.total_xp.toLocaleString()} XP
                        </span>
                        <span className="text-[11px] font-rajdhani text-text-muted ml-2">
                          ({cat.currentLevelXP} / {cat.xpForNextLevel} to next)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface h-3 rounded-full overflow-hidden p-0.5 border border-surface-border">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${cat.progressPercent}%`,
                          backgroundColor: cat.color,
                          boxShadow: `0 0 10px ${cat.color}80`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily XP Activity Graph (Recharts) */}
          <div className="system-panel rounded-xl p-6 border-solo-blue/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-solo-cyan" />
                <h2 className="font-orbitron font-extrabold text-xl text-text-primary">
                  XP Progression Graph
                </h2>
              </div>

              {/* Days Selector */}
              <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-surface-border self-start sm:self-auto">
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDaysFilter(d)}
                    className={`px-2.5 py-1 rounded font-rajdhani text-xs font-bold transition-all ${
                      daysFilter === d
                        ? 'bg-solo-cyan text-black'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {d}D
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-64 bg-surface-border/30 rounded-xl animate-pulse" />
            ) : (
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="xpColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232334" />
                    <XAxis
                      dataKey="label"
                      stroke="#64748b"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                    />
                    <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#12121a',
                        borderColor: '#4f8ef7',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                        fontFamily: 'Orbitron',
                      }}
                      formatter={(val: any) => [`+${val} XP`, 'XP Earned']}
                    />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      stroke="#22d3ee"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#xpColor)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Active Habit Streaks Leaderboard */}
        <div className="space-y-6">
          <div className="system-panel rounded-xl p-6 border-solo-gold/30 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
              <Flame className="w-5 h-5 text-solo-gold" />
              <h2 className="font-orbitron font-extrabold text-lg text-text-primary">
                Habit Streaks
              </h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-surface-border/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : streaks.length === 0 ? (
              <p className="text-xs font-rajdhani text-text-muted text-center py-4">
                No active habit streaks recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {streaks.map((s) => (
                  <div
                    key={s.task_id}
                    className="p-3 bg-surface/80 rounded-lg border border-surface-border flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-[11px] font-rajdhani font-bold text-text-muted">
                        <span>{s.category_icon}</span>
                        <span>{s.category_name}</span>
                      </div>
                      <div className="font-semibold text-sm text-text-primary truncate">
                        {s.task_title}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-orbitron font-extrabold text-solo-gold text-sm flex items-center gap-1 justify-end">
                        <Flame className="w-3.5 h-3.5 fill-solo-gold" />
                        {s.current_streak}d
                      </div>
                      <div className="text-[10px] font-rajdhani text-text-muted">
                        Best: {s.longest_streak}d
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
