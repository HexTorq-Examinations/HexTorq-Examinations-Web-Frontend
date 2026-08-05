'use client';

import { Loader2 } from 'lucide-react';
import { useLoadingStore } from '@/store/loadingStore';

export function GlobalLoadingOverlay() {
  const pendingCount = useLoadingStore((state) => state.pendingCount);
  if (pendingCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px] dark:bg-slate-950/40"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-xl dark:bg-slate-900">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Loading...</span>
      </div>
    </div>
  );
}
