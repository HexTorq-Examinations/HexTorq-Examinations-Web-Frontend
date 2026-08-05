'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkPing({ variant = 'default' }: { variant?: 'default' | 'transparent' }) {
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkPing = async () => {
      const start = Date.now();
      try {
        await api.get('/time', { timeout: 3000, silent: true });
        if (mounted) {
          // Date.now() - start is the full round trip; halve it for the
          // one-way client-to-server time, which is what's actually shown.
          setPing(Math.round((Date.now() - start) / 2));
        }
      } catch (err) {
        if (mounted) setPing(999);
      }
    };
    checkPing();
    const interval = setInterval(checkPing, 10000); // Check every 10 seconds
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (ping === null) {
    return (
      <div 
        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50", variant === 'transparent' ? 'border-transparent bg-transparent p-0' : '')}
        title="Checking network..."
      >
        <Wifi className="w-3.5 h-3.5 text-slate-400 animate-pulse" />
        <span className="text-xs font-mono font-medium text-slate-400 animate-pulse">
          ...
        </span>
      </div>
    );
  }

  const getPingColor = () => {
    if (ping < 100) return 'text-emerald-500';
    if (ping < 300) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div 
      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50", variant === 'transparent' ? 'border-transparent bg-transparent p-0' : '')}
      title={`Network Latency: ${ping}ms`}
    >
      <Wifi className={cn("w-3.5 h-3.5", getPingColor())} />
      <span className={cn("text-xs font-mono font-medium", variant === 'transparent' ? 'text-white' : 'text-slate-600 dark:text-slate-400')}>
        {ping}ms
      </span>
    </div>
  );
}
