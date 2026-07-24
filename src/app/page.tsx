'use client';

import { useEffect, useState, useCallback } from 'react';
import PlayerCard from '@/components/PlayerCard';
import TaskCard, { TaskItem } from '@/components/TaskCard';
import LevelUpModal from '@/components/LevelUpModal';
import BossRaidCard from '@/components/BossRaidCard';
import { RankInfo, getOverallRank, getFormattedDate } from '@/lib/xp';
import { Flame, Plus, Sparkles, Calendar, Layers, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const [playerXP, setPlayerXP] = useState<number>(0);
  const [playerRank, setPlayerRank] = useState<RankInfo>(getOverallRank(0));
  const [activeStreaks, setActiveStreaks] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Boss Raid damage strike animation state
  const [lastDamageDealt, setLastDamageDealt] = useState<number | null>(null);

  // Level Up Modal state
  const [levelUpData, setLevelUpData] = useState<{ isOpen: boolean; categoryName: string; newLevel: number }>({
    isOpen: false,
    categoryName: '',
    newLevel: 1,
  });

  const todayStr = getFormattedDate();

  const fetchData = useCallback(async (isInitial = false, forceFetch = false) => {
    // 1. Try loading cached dashboard data if not forcing fetch
    const cachedDataStr = typeof window !== 'undefined' ? localStorage.getItem('levelup_dashboard_cache') : null;
    if (cachedDataStr && !forceFetch) {
      try {
        const cached = JSON.parse(cachedDataStr);
        const ageMs = Date.now() - (cached.timestamp || 0);
        if (cached.date === todayStr && ageMs < 30000) {
          // Cache is fresh (under 30s) and same day: use it immediately and skip fetch!
          setTasks(cached.tasks || []);
          setCompletions(cached.completions || {});
          setPlayerXP(cached.playerXP || 0);
          setPlayerRank(cached.playerRank || getOverallRank(0));
          setActiveStreaks(cached.activeStreaks || 0);
          setLoading(false);
          return;
        }
      } catch (e) {}
    }

    if (isInitial) setLoading(true);
    try {
      // 1. Fetch active tasks
      const tasksRes = await fetch('/api/tasks');
      const tasksData = await tasksRes.json();
      const loadedTasks: TaskItem[] = tasksData.tasks || [];

      // 2. Fetch today's completions
      const compRes = await fetch(`/api/completions?date=${todayStr}`);
      const compData = await compRes.json();
      const compMap: Record<number, boolean> = {};
      if (compData.completions) {
        compData.completions.forEach((c: any) => {
          compMap[c.task_id] = true;
        });
      }

      // 3. Fetch XP stats
      const xpRes = await fetch('/api/stats/xp');
      const xpData = await xpRes.json();
      const nextXP = xpData.totalXP || 0;
      const nextRank = xpData.rank || getOverallRank(0);
      setPlayerXP(nextXP);
      setPlayerRank(nextRank);

      // 4. Fetch streaks stats
      const streakRes = await fetch('/api/stats/streaks');
      const streakData = await streakRes.json();
      const activeCount = (streakData.streaks || []).filter((s: any) => Number(s.current_streak) > 0).length;
      setActiveStreaks(activeCount);

      setTasks(loadedTasks);
      setCompletions(compMap);

      // Update localStorage cache
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'levelup_dashboard_cache',
          JSON.stringify({
            date: todayStr,
            tasks: loadedTasks,
            completions: compMap,
            playerXP: nextXP,
            playerRank: nextRank,
            activeStreaks: activeCount,
            timestamp: Date.now(),
          })
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    // Instant initial mount cache loading
    const cachedDataStr = typeof window !== 'undefined' ? localStorage.getItem('levelup_dashboard_cache') : null;
    if (cachedDataStr) {
      try {
        const cached = JSON.parse(cachedDataStr);
        if (cached.date === todayStr) {
          setTasks(cached.tasks || []);
          setCompletions(cached.completions || {});
          setPlayerXP(cached.playerXP || 0);
          setPlayerRank(cached.playerRank || getOverallRank(0));
          setActiveStreaks(cached.activeStreaks || 0);
          setLoading(false);
        }
      } catch (e) {}
    }
    fetchData(true);
  }, [fetchData, todayStr]);

  const handleToggleTask = async (task: TaskItem, isCompleted: boolean) => {
    if (completions[task.id]) return; // Locked once completed

    try {
      // Optimistically update completions map locally to prevent flicker
      setCompletions((prev) => ({ ...prev, [task.id]: true }));

      // Complete task API
      const res = await fetch('/api/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: task.id, date: todayStr }),
      });
      const data = await res.json();

      if (res.ok) {
        const earned = Number(data.xpEarned || 0);

        // Optimistically update player XP and Rank instantly!
        if (earned > 0) {
          setPlayerXP((prevXP) => {
            const nextXP = prevXP + earned;
            setPlayerRank(getOverallRank(nextXP));
            return nextXP;
          });
        }

        // Trigger Boss Raid damage
        if (data.xpEarned) {
          setLastDamageDealt(data.xpEarned);
          setTimeout(() => setLastDamageDealt(null), 1500);
        }

        // Silent background refetch of stats, forcing fresh database load
        fetchData(false, true);

        if (data.leveledUp) {
          setLevelUpData({
            isOpen: true,
            categoryName: data.categoryName || 'Category',
            newLevel: data.newLevel || 1,
          });
        }

        return { xpEarned: data.xpEarned };
      } else {
        // Rollback optimistic update on error
        setCompletions((prev) => {
          const copy = { ...prev };
          delete copy[task.id];
          return copy;
        });
      }
    } catch (err) {
      console.error('Error toggling completion:', err);
    }
  };

  const habits = tasks.filter((t) => t.type === 'habit');
  // Undone priority tasks
  const priorities = tasks.filter((t) => t.type === 'priority' && !completions[t.id]);

  const habitsDoneCount = habits.filter((h) => completions[h.id]).length;
  const habitProgressPercent = habits.length > 0 ? Math.round((habitsDoneCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Player Header Banner */}
      <PlayerCard
        rank={playerRank}
        totalXP={playerXP}
        activeStreaksCount={activeStreaks}
        loading={loading}
      />

      {/* Level Up Celebration Dialog */}
      <LevelUpModal
        isOpen={levelUpData.isOpen}
        categoryName={levelUpData.categoryName}
        newLevel={levelUpData.newLevel}
        onClose={() => setLevelUpData((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Main Quest Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Boss Raid Widget + Daily Habits Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Boss Raid Widget */}
          <BossRaidCard lastDamageDealt={lastDamageDealt} onRefresh={() => fetchData(false)} />

          {/* Daily Habits Section */}
          <div className="system-panel rounded-xl p-6 border-solo-blue/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-surface-border">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-solo-cyan animate-ping" />
                  <span className="text-xs font-rajdhani font-bold uppercase tracking-widest text-solo-cyan">
                    DAILY QUEST LIST
                  </span>
                </div>
                <h1 className="font-orbitron font-extrabold text-xl sm:text-2xl text-text-primary mt-1">
                  Today's Habit Checklist
                </h1>
              </div>

              {/* Progress pill */}
              <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-lg border border-surface-border shrink-0">
                <div className="text-right">
                  <div className="font-orbitron font-bold text-solo-cyan text-sm">
                    {habitsDoneCount} / {habits.length} Cleared
                  </div>
                  <div className="text-[11px] font-rajdhani text-text-muted font-semibold">
                    {habitProgressPercent}% Complete
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-solo-cyan/40 p-0.5 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-solo-cyan/20 flex items-center justify-center text-solo-cyan font-orbitron text-xs font-bold">
                    {habitProgressPercent}%
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface-border/40 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : habits.length === 0 ? (
              <div className="text-center py-12 px-4 bg-surface/40 rounded-xl border border-dashed border-surface-border">
                <Flame className="w-12 h-12 text-text-dim mx-auto mb-3" />
                <h3 className="font-orbitron text-base text-text-muted font-bold">No Daily Habits Configured</h3>
                <p className="font-rajdhani text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  Add recurring habits to build your daily streak and earn multiplied XP.
                </p>
                <Link
                  href="/tasks"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-solo-blue/20 text-solo-blue border border-solo-blue/40 font-rajdhani font-bold text-xs uppercase hover:bg-solo-blue/30 transition-all"
                >
                  <Plus className="w-4 h-4" /> Create Habit
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((habit) => (
                  <TaskCard
                    key={habit.id}
                    task={{
                      ...habit,
                      is_completed_today: !!completions[habit.id],
                    }}
                    onToggleComplete={handleToggleTask}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Priorities Section */}
          <div className="system-panel rounded-xl p-6 border-solo-violet/30">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-solo-violet" />
                <h2 className="font-orbitron font-bold text-lg text-text-primary">Priority Tasks (Undone)</h2>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-rajdhani font-semibold text-solo-violet hover:underline flex items-center gap-1"
              >
                Manage All <Plus className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="h-16 bg-surface-border/40 rounded-xl animate-pulse" />
            ) : priorities.length === 0 ? (
              <div className="text-center py-6 bg-surface/30 rounded-lg border border-dashed border-surface-border">
                <CheckCircle2 className="w-8 h-8 text-solo-cyan/40 mx-auto mb-2" />
                <p className="text-xs font-rajdhani text-text-muted font-bold">
                  All priority tasks cleared! Great work.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {priorities.map((priority) => (
                  <TaskCard
                    key={priority.id}
                    task={{
                      ...priority,
                      is_completed_today: !!completions[priority.id],
                    }}
                    onToggleComplete={handleToggleTask}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Quest Rules & System Log Quick Summary */}
        <div className="space-y-6">
          <div className="system-panel rounded-xl p-5 border-surface-border space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-surface-border">
              <Calendar className="w-4 h-4 text-solo-cyan" />
              <h3 className="font-orbitron font-bold text-sm text-text-primary uppercase tracking-wider">
                Daily System Date
              </h3>
            </div>

            <div className="bg-surface rounded-lg p-3 text-center border border-surface-border">
              <div className="font-orbitron font-extrabold text-xl text-solo-cyan">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="text-[11px] font-rajdhani text-text-muted uppercase mt-0.5">
                Cycle Resets at 01:00 AM Daily
              </div>
            </div>

            <div className="space-y-2 text-xs font-rajdhani text-text-muted">
              <div className="flex justify-between items-center py-1 border-b border-surface-border/50">
                <span>Streak 7-13 days:</span>
                <span className="font-bold text-solo-cyan">1.2x Multiplier</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-surface-border/50">
                <span>Streak 14-29 days:</span>
                <span className="font-bold text-solo-blue">1.5x Multiplier</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-surface-border/50">
                <span>Streak 30+ days:</span>
                <span className="font-bold text-solo-gold">2.0x Multiplier</span>
              </div>
              <div className="flex justify-between items-center py-1 text-solo-danger font-semibold">
                <span>Missed Habit Penalty:</span>
                <span>-50% Base XP</span>
              </div>
            </div>
          </div>

          <div className="system-panel rounded-xl p-5 border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-solo-gold" />
                <h3 className="font-orbitron font-bold text-sm text-text-primary uppercase tracking-wider">
                  Quick Actions
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/tasks"
                className="p-3 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-center font-rajdhani font-bold text-xs uppercase text-text-primary transition-all"
              >
                + New Task
              </Link>
              <Link
                href="/categories"
                className="p-3 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-center font-rajdhani font-bold text-xs uppercase text-text-primary transition-all"
              >
                + New Domain
              </Link>
              <Link
                href="/stats"
                className="p-3 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-center font-rajdhani font-bold text-xs uppercase text-text-primary transition-all"
              >
                View Stats
              </Link>
              <Link
                href="/log"
                className="p-3 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-center font-rajdhani font-bold text-xs uppercase text-text-primary transition-all"
              >
                XP Audit Log
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
