'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Fetches the current time from the backend once (not the device's system
// clock), then ticks locally from that point on using an offset — so the
// displayed time stays correct even if the visitor's own clock is wrong.
export function useServerClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let offsetMs = 0;
    let cancelled = false;

    api.get('/time', { silent: true })
      .then(({ data }) => {
        if (cancelled) return;
        offsetMs = new Date(data.now).getTime() - Date.now();
        setNow(new Date(Date.now() + offsetMs));
      })
      .catch(() => {
        // Fall back to the local device clock if the backend is unreachable.
        setNow(new Date());
      });

    const interval = setInterval(() => {
      setNow(new Date(Date.now() + offsetMs));
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return now;
}
