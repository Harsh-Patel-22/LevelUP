'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-[#e2e8f0] font-sans min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#12121a] border border-[#ef4444]/40 text-center space-y-4">
          <h2 className="font-bold text-xl text-[#ef4444]">
            CRITICAL SYSTEM ERROR
          </h2>
          <p className="text-xs text-slate-400">
            {error.message || 'An unexpected global error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] font-bold text-xs uppercase hover:bg-[#ef4444]/30"
          >
            RESTART SYSTEM
          </button>
        </div>
      </body>
    </html>
  );
}
