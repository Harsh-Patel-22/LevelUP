'use client';

import { useEffect } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="system-panel-glow max-w-md w-full rounded-2xl p-8 border-solo-danger/40 space-y-4">
        <ShieldAlert className="w-12 h-12 text-solo-danger mx-auto animate-pulse" />
        <h2 className="font-orbitron font-extrabold text-xl text-text-primary">
          SYSTEM NOTICE: RUNTIME ERROR
        </h2>
        <p className="font-rajdhani text-xs text-text-muted">
          An unexpected anomaly occurred in the system. Click reset to restore player status.
        </p>
        <button
          onClick={() => reset()}
          className="w-full py-3 rounded-xl bg-solo-danger/20 border border-solo-danger/40 text-solo-danger font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-solo-danger/30 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> RESET SYSTEM
        </button>
      </div>
    </div>
  );
}
