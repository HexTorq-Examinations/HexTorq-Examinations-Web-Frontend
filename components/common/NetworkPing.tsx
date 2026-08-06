'use client';

import { useEffect } from 'react';
import { api } from '@/lib/api';

// No visible UI — just periodically logs one-way network latency to the
// console with a timestamp, for diagnostics, without showing a badge/popup.
export function NetworkPing() {
  useEffect(() => {
    let mounted = true;
    const checkPing = async () => {
      const start = Date.now();
      try {
        await api.get('/time', { timeout: 3000, silent: true });
        if (mounted) {
          const oneWayMs = Math.round((Date.now() - start) / 2);
          console.log(`[NetworkPing] ${new Date().toISOString()} — ${oneWayMs}ms`);
        }
      } catch {
        if (mounted) {
          console.log(`[NetworkPing] ${new Date().toISOString()} — request failed`);
        }
      }
    };
    checkPing();
    const interval = setInterval(checkPing, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return null;
}
