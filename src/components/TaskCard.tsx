'use client';

import { useState } from 'react';
import { Flame, Check, Zap, Lock } from 'lucide-react';
import { getStreakMultiplier, getBaseXP } from '@/lib/xp';
import { playQuestCompleteSFX } from '@/lib/sound';

export interface TaskItem {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  type: 'habit' | 'priority';
  weight: number; // 1-4
  is_active: number;
  current_streak: number;
  longest_streak: number;
  is_completed_today?: boolean;
}

interface TaskCardProps {
  task: TaskItem;
  onToggleComplete: (task: TaskItem, isCompleted: boolean) => Promise<{ xpEarned?: number; leveledUp?: boolean; newLevel?: number; categoryName?: string } | void>;
  onEdit?: (task: TaskItem) => void;
  onArchive?: (task: TaskItem) => void;
}

const WEIGHT_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Routine', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
  2: { label: 'Normal', color: 'text-solo-blue bg-solo-blue/10 border-solo-blue/20' },
  3: { label: 'Important', color: 'text-solo-gold bg-solo-gold/10 border-solo-gold/20' },
  4: { label: 'Critical', color: 'text-solo-danger bg-solo-danger/10 border-solo-danger/20' },
};

export default function TaskCard({ task, onToggleComplete, onEdit, onArchive }: TaskCardProps) {
  const [completed, setCompleted] = useState(!!task.is_completed_today);
  const [loading, setLoading] = useState(false);
  const [floatingXP, setFloatingXP] = useState<number | null>(null);

  const baseXP = getBaseXP(task.weight);
  const multiplier = task.type === 'habit' ? getStreakMultiplier(task.current_streak) : 1;
  const projectedXP = Math.round(baseXP * multiplier);

  const handleCheckboxChange = async () => {
    if (loading || completed) return; // Locked once completed
    setCompleted(true);
    setLoading(true);
    playQuestCompleteSFX();

    try {
      const result = await onToggleComplete(task, true);
      if (result?.xpEarned) {
        setFloatingXP(result.xpEarned);
        setTimeout(() => setFloatingXP(null), 1200);
      }
    } catch (err) {
      setCompleted(false); // rollback on error
    } finally {
      setLoading(false);
    }
  };

  const weightInfo = WEIGHT_LABELS[task.weight] || WEIGHT_LABELS[2];

  return (
    <div
      className={`system-panel rounded-xl p-4 transition-all duration-300 relative group overflow-hidden ${
        completed ? 'bg-surface/50 border-solo-cyan/30 opacity-90' : 'hover:border-solo-blue/40'
      }`}
    >
      {/* Floating XP Animation */}
      {floatingXP !== null && (
        <div className="absolute top-2 right-12 z-20 pointer-events-none animate-float-xp font-orbitron font-extrabold text-solo-cyan text-lg drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
          +{floatingXP} XP!
        </div>
      )}

      <div className="flex items-start gap-3 sm:gap-4">
        {/* Custom RPG Checkbox (Disabled when completed - LOCKED) */}
        <button
          onClick={handleCheckboxChange}
          disabled={loading || completed}
          title={completed ? 'Quest completion is locked' : 'Mark quest as complete'}
          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all duration-200 mt-0.5 ${
            completed
              ? 'bg-solo-cyan/20 border-solo-cyan text-solo-cyan cursor-not-allowed shadow-[0_0_12px_rgba(34,211,238,0.3)]'
              : 'border-solo-blue/40 bg-surface/80 hover:border-solo-cyan hover:bg-solo-cyan/10'
          }`}
        >
          {completed ? <Check className="w-4 h-4 stroke-[3]" /> : null}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {/* Category Tag */}
            <span
              className="inline-flex items-center gap-1 text-[11px] font-rajdhani font-bold px-2 py-0.5 rounded border"
              style={{
                backgroundColor: `${task.category_color}15`,
                borderColor: `${task.category_color}40`,
                color: task.category_color,
              }}
            >
              <span>{task.category_icon}</span>
              <span>{task.category_name}</span>
            </span>

            {/* Weight Tag */}
            <span
              className={`text-[10px] font-rajdhani font-extrabold uppercase px-1.5 py-0.5 rounded border ${weightInfo.color}`}
            >
              {weightInfo.label}
            </span>

            {/* Habit Streak Tag */}
            {task.type === 'habit' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-rajdhani font-bold text-solo-gold bg-solo-gold/10 px-2 py-0.5 rounded border border-solo-gold/20">
                <Flame className="w-3 h-3 text-solo-gold fill-solo-gold/30" />
                {task.current_streak}d streak
                {multiplier > 1.0 && <span className="text-solo-cyan">({multiplier}x)</span>}
              </span>
            )}

            {/* Completed Lock Tag */}
            {completed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-rajdhani font-extrabold text-solo-cyan bg-solo-cyan/10 px-2 py-0.5 rounded border border-solo-cyan/30 uppercase tracking-wider">
                <Lock className="w-3 h-3 text-solo-cyan" />
                Cleared (Locked)
              </span>
            )}
          </div>

          <h3
            className={`font-semibold text-sm sm:text-base transition-all duration-200 ${
              completed ? 'line-through text-text-muted font-normal' : 'text-text-primary'
            }`}
          >
            {task.title}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs font-rajdhani font-medium text-text-muted">
            <span className="flex items-center gap-1 text-solo-cyan">
              <Zap className="w-3.5 h-3.5" />
              {completed ? 'Earned' : 'Reward'}: {projectedXP} XP
            </span>
            {task.type === 'priority' && (
              <span className="text-text-dim uppercase tracking-wider text-[10px]">
                One-Off Priority
              </span>
            )}
          </div>
        </div>

        {/* Optional Actions */}
        {(onEdit || onArchive) && !completed && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onArchive && (
              <button
                onClick={() => onArchive(task)}
                className="p-1 rounded text-text-muted hover:text-solo-danger hover:bg-solo-danger/10 text-xs font-rajdhani"
                title="Archive Task"
              >
                Archive
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
