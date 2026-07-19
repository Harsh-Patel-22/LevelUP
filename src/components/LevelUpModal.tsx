'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Check } from 'lucide-react';

interface LevelUpModalProps {
  isOpen: boolean;
  categoryName: string;
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ isOpen, categoryName, newLevel, onClose }: LevelUpModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4f8ef7', '#22d3ee', '#7c3aed', '#f59e0b'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4f8ef7', '#22d3ee', '#7c3aed', '#f59e0b'],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="system-panel-glow w-full max-w-md rounded-2xl p-6 border-2 border-solo-cyan shadow-[0_0_50px_rgba(34,211,238,0.4)] text-center relative overflow-hidden transform transition-all scale-100">
        {/* Holographic Glowing Header Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-solo-blue via-solo-cyan to-solo-violet animate-pulse" />

        {/* System Alert Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-solo-cyan/10 border border-solo-cyan/30 text-solo-cyan text-xs font-rajdhani font-bold tracking-widest uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          SYSTEM NOTIFICATION
        </div>

        {/* Level Up Title */}
        <h2 className="font-orbitron font-black text-4xl sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-solo-cyan via-solo-blue to-solo-violet tracking-tight animate-bounce">
          LEVEL UP!
        </h2>

        <div className="my-6 py-4 bg-surface/90 rounded-xl border border-solo-blue/30 relative">
          <Trophy className="w-12 h-12 mx-auto text-solo-gold mb-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
          
          <div className="font-rajdhani font-bold text-text-muted text-sm uppercase tracking-wider">
            Domain Mastery Increased
          </div>
          
          <div className="font-orbitron font-extrabold text-2xl text-text-primary mt-1">
            {categoryName}
          </div>

          <div className="inline-block mt-3 px-4 py-1.5 rounded-lg bg-solo-blue/20 border border-solo-blue/50 font-orbitron font-bold text-xl text-solo-cyan">
            LEVEL {newLevel}
          </div>
        </div>

        <p className="font-rajdhani text-sm text-text-muted mb-6">
          Your parameters have been updated. Your stats and overall Hunter Rank progress have increased.
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-solo-blue to-solo-cyan hover:from-solo-blue/90 hover:to-solo-cyan/90 text-black font-orbitron font-extrabold text-base tracking-wider uppercase shadow-[0_0_20px_rgba(79,142,247,0.4)] transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          ACCEPT REWARD
        </button>
      </div>
    </div>
  );
}
