'use client';

import { useEffect, useState } from 'react';
import { Skull, Swords, Trophy, Zap, ShieldAlert } from 'lucide-react';
import { playBossDamageSFX } from '@/lib/sound';

export interface BossData {
  id: number;
  name: string;
  title: string;
  avatar: string;
  current_hp: number;
  max_hp: number;
  reward_xp: number;
  is_defeated: number;
  end_date: string;
}

interface BossRaidCardProps {
  lastDamageDealt?: number | null;
  onRefresh?: () => void;
}

export default function BossRaidCard({ lastDamageDealt }: BossRaidCardProps) {
  const [boss, setBoss] = useState<BossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [damageEffect, setDamageEffect] = useState<number | null>(null);

  const fetchBoss = async () => {
    try {
      const res = await fetch('/api/boss');
      const data = await res.json();
      setBoss(data.boss || null);
    } catch (err) {
      console.error('Failed to fetch boss raid:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoss();
  }, []);

  useEffect(() => {
    if (lastDamageDealt && lastDamageDealt > 0) {
      playBossDamageSFX();
      setDamageEffect(lastDamageDealt);
      fetchBoss();
      const timer = setTimeout(() => setDamageEffect(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [lastDamageDealt]);

  if (loading) {
    return <div className="system-panel rounded-xl p-5 h-32 animate-pulse" />;
  }

  if (!boss) return null;

  const hpPercent = Math.min(100, Math.max(0, (boss.current_hp / boss.max_hp) * 100));
  const isDefeated = boss.is_defeated === 1 || boss.current_hp === 0;

  return (
    <div
      className={`system-panel-glow rounded-xl p-5 border relative overflow-hidden transition-all duration-300 ${
        isDefeated
          ? 'border-solo-gold/50 bg-solo-gold/5 shadow-[0_0_25px_rgba(245,158,11,0.2)]'
          : 'border-solo-danger/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
      }`}
    >
      {/* Damage Strike Float Animation */}
      {damageEffect !== null && (
        <div className="absolute top-3 right-6 z-20 pointer-events-none animate-float-xp font-orbitron font-black text-solo-danger text-xl drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]">
          💥 -{damageEffect} HP!
        </div>
      )}

      {/* Top Header Tag */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
        <div className="flex items-center gap-2">
          <Skull className={`w-4 h-4 ${isDefeated ? 'text-solo-gold' : 'text-solo-danger animate-pulse'}`} />
          <span
            className={`text-xs font-rajdhani font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
              isDefeated
                ? 'bg-solo-gold/10 border-solo-gold/30 text-solo-gold'
                : 'bg-solo-danger/10 border-solo-danger/30 text-solo-danger'
            }`}
          >
            {isDefeated ? 'RAID CLEARED' : 'WEEKLY BOSS RAID'}
          </span>
        </div>

        <span className="text-[11px] font-rajdhani text-text-muted font-bold">
          Reward: <strong className="text-solo-gold font-orbitron">+{boss.reward_xp} XP</strong>
        </span>
      </div>

      <div className="flex items-start gap-4">
        {/* Boss Avatar */}
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 border shadow-lg ${
            isDefeated
              ? 'bg-solo-gold/20 border-solo-gold text-solo-gold'
              : 'bg-solo-danger/20 border-solo-danger text-solo-danger animate-pulse'
          }`}
        >
          {boss.avatar || '⚔️'}
        </div>

        {/* Boss Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-orbitron font-extrabold text-base text-text-primary truncate">
                {boss.name}
              </h3>
              <p className="font-rajdhani text-xs text-text-muted font-semibold">{boss.title}</p>
            </div>
            <span className="font-orbitron font-bold text-xs text-solo-danger">
              {boss.current_hp.toLocaleString()} / {boss.max_hp.toLocaleString()} HP
            </span>
          </div>

          {/* HP Bar */}
          <div className="w-full bg-surface h-3 rounded-full overflow-hidden p-0.5 border border-surface-border mt-2 relative">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isDefeated
                  ? 'bg-solo-gold shadow-[0_0_10px_rgba(245,158,11,0.8)]'
                  : 'bg-gradient-to-r from-solo-danger via-amber-500 to-solo-danger shadow-[0_0_10px_rgba(239,68,68,0.8)]'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] font-rajdhani text-text-muted font-bold mt-1.5">
            <span>Every task completion deals damage = earned XP!</span>
            <span>{isDefeated ? 'VICTORY ACHIEVED' : `${Math.round(hpPercent)}% Remaining`}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
