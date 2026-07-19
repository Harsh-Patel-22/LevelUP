'use client';

import { useEffect, useState } from 'react';
import { History, Zap, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

interface LogItem {
  id: number;
  delta: number;
  reason: string;
  logged_at: string;
  category_name: string;
  category_icon: string;
  category_color: string;
}

export default function LogPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/log?limit=50');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="system-panel rounded-xl p-6 border-solo-blue/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-solo-cyan" />
            <h1 className="font-orbitron font-extrabold text-2xl text-text-primary">
              XP Audit Log
            </h1>
          </div>
          <p className="font-rajdhani text-xs text-text-muted mt-1">
            System ledger tracking all earned XP points, level progression, and streak failure penalties.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-hover border border-surface-border text-xs font-rajdhani font-bold text-text-primary flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Log
        </button>
      </div>

      {/* Log Feed */}
      <div className="system-panel rounded-xl p-6 border-surface-border space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-surface-border/40 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-text-dim mx-auto mb-3" />
            <h3 className="font-orbitron text-base text-text-muted font-bold">No XP Activity Logged Yet</h3>
            <p className="font-rajdhani text-xs text-text-muted mt-1">
              Complete quests on your dashboard to see real-time ledger entries here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isPositive = log.delta > 0;
              return (
                <div
                  key={log.id}
                  className="p-4 bg-surface/80 rounded-xl border border-surface-border flex items-center justify-between gap-4 hover:border-solo-blue/30 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg border ${
                        isPositive
                          ? 'bg-solo-cyan/10 border-solo-cyan/30 text-solo-cyan'
                          : 'bg-solo-danger/10 border-solo-danger/30 text-solo-danger'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-rajdhani font-bold px-2 py-0.5 rounded border"
                          style={{
                            backgroundColor: `${log.category_color}15`,
                            borderColor: `${log.category_color}40`,
                            color: log.category_color,
                          }}
                        >
                          <span>{log.category_icon}</span>
                          <span>{log.category_name}</span>
                        </span>

                        <span className="text-[11px] font-rajdhani font-semibold text-text-muted">
                          {log.reason}
                        </span>
                      </div>

                      <div className="text-xs font-rajdhani text-text-muted">
                        Logged on: {new Date(log.logged_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`font-orbitron font-extrabold text-base ${
                        isPositive ? 'text-solo-cyan' : 'text-solo-danger'
                      }`}
                    >
                      {isPositive ? `+${log.delta}` : log.delta} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
