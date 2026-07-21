'use client';

import { useState, useEffect } from 'react';
import { getFormattedDate } from '@/lib/xp';

interface HeatmapDay {
  date: string;
  xp: number;
  dayOfWeek: number; // 0 (Sun) to 6 (Sat)
  monthLabel?: string;
}

interface XPHeatmapProps {
  historyLogs?: Array<{ date: string; xp: number }>;
}

export default function XPHeatmap({ historyLogs = [] }: XPHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="system-panel rounded-xl p-5 border-solo-blue/30 h-44 animate-pulse" />
    );
  }

  // Map input history array into a fast lookup map
  const xpMap = new Map<string, number>();
  historyLogs.forEach((item) => {
    if (item && item.date) {
      xpMap.set(item.date, Number(item.xp || 0));
    }
  });

  // Generate 365 days leading up to today
  const today = new Date();
  const totalDays = 365;
  const daysList: HeatmapDay[] = [];

  // Start from (today - 364 days)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  let lastMonth = -1;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    const dateStr = getFormattedDate(d);
    const month = d.getMonth();

    let monthLabel: string | undefined = undefined;
    if (month !== lastMonth && d.getDate() <= 7) {
      monthLabel = d.toLocaleDateString('en-US', { month: 'short' });
      lastMonth = month;
    }

    daysList.push({
      date: dateStr,
      xp: xpMap.get(dateStr) || 0,
      dayOfWeek: d.getDay(),
      monthLabel,
    });
  }

  // Organize days into 52+ week columns of 7 days each
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];

  daysList.forEach((day) => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6 || currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColorClass = (xp: number) => {
    if (xp === 0) return 'bg-surface border-surface-border';
    if (xp < 50) return 'bg-slate-800 border-slate-700';
    if (xp < 150) return 'bg-blue-900 border-blue-700';
    if (xp < 300) return 'bg-solo-blue/70 border-solo-blue';
    return 'bg-solo-cyan border-solo-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)]';
  };

  return (
    <div className="system-panel rounded-xl p-5 border-solo-blue/30 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <h3 className="font-orbitron font-extrabold text-lg text-text-primary">
            365-Day XP Contribution Grid
          </h3>
          <p className="font-rajdhani text-xs text-text-muted">
            Daily consistency heatmap tracking your quest XP over the past year.
          </p>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-1.5 text-[11px] font-rajdhani font-semibold text-text-muted">
          <span>Less</span>
          <span className="w-3 h-3 rounded bg-surface border border-surface-border" />
          <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700" />
          <span className="w-3 h-3 rounded bg-blue-900 border border-blue-700" />
          <span className="w-3 h-3 rounded bg-solo-blue/70 border border-solo-blue" />
          <span className="w-3 h-3 rounded bg-solo-cyan border border-solo-cyan" />
          <span>More XP</span>
        </div>
      </div>

      {/* Heatmap Grid Container */}
      <div className="relative overflow-x-auto no-scrollbar pb-2">
        <div className="inline-block min-w-full">
          <div className="flex gap-1">
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3 h-3 rounded-sm border transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10 ${getColorClass(
                      day.xp
                    )}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Tooltip Footer */}
      <div className="h-6 flex items-center justify-between text-xs font-rajdhani font-bold text-text-muted">
        {hoveredDay ? (
          <span className="text-solo-cyan">
            {new Date(hoveredDay.date).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            : <strong className="text-text-primary font-orbitron">{hoveredDay.xp} XP Earned</strong>
          </span>
        ) : (
          <span>Hover over squares to inspect daily XP earnings</span>
        )}
      </div>
    </div>
  );
}
