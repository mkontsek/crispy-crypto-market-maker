'use client';

import { engineStreamSchema } from '@crispy/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useEngineStore } from '@/stores/engine-store';

export function useEngineStream() {
  const queryClient = useQueryClient();
  const setConnected = useEngineStore((state) => state.setConnected);
  const ingestPayload = useEngineStore((state) => state.ingestPayload);
  const lastInvalidateRef = useRef(0);

  useEffect(() => {
    const source = new EventSource('/api/stream');

    source.onopen = () => {
      setConnected(true);
    };

    source.onerror = () => {
      setConnected(false);
    };

    source.onmessage = (event) => {
      const raw = JSON.parse(event.data) as unknown;
      const parsed = engineStreamSchema.safeParse(raw);
      if (!parsed.success) {
        return;
      }

      ingestPayload(parsed.data);

      const now = Date.now();
      if (now - lastInvalidateRef.current > 1_500) {
        lastInvalidateRef.current = now;
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
        queryClient.invalidateQueries({ queryKey: ['fills'] });
        queryClient.invalidateQueries({ queryKey: ['pnl'] });
        queryClient.invalidateQueries({ queryKey: ['inventory'] });
      }
    };

    return () => {
      source.close();
      setConnected(false);
    };
  }, [ingestPayload, queryClient, setConnected]);
}
