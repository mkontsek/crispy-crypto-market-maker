'use client';

import type { FC } from 'react';
import { useEffect, useReducer, useRef } from 'react';

import type { QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logLevelTone, logReducer, makeLogEntry } from '@/lib/event-log-service';

type EventLogSectionProps = {
  connected: boolean;
  quotes: QuoteSnapshot[];
  killSwitchEngaged: boolean;
};

export const EventLogSection: FC<EventLogSectionProps> = ({ connected, quotes, killSwitchEngaged }) => {
  const [log, dispatch] = useReducer(logReducer, []);
  const prevConnected = useRef<boolean | null>(null);
  const prevKillSwitch = useRef<boolean | null>(null);
  const prevPaused = useRef(new Map<string, boolean>());

  useEffect(() => {
    const entries = [];

    if (prevConnected.current !== null && prevConnected.current !== connected) {
      entries.push(
        makeLogEntry(connected ? 'info' : 'critical', connected ? 'Bot stream connected' : 'Bot stream disconnected')
      );
    }
    prevConnected.current = connected;

    if (prevKillSwitch.current !== null && prevKillSwitch.current !== killSwitchEngaged) {
      entries.push(
        makeLogEntry(
          killSwitchEngaged ? 'critical' : 'info',
          killSwitchEngaged ? 'Kill switch ENGAGED — all quoting halted' : 'Kill switch DISENGAGED'
        )
      );
    }
    prevKillSwitch.current = killSwitchEngaged;

    for (const quote of quotes) {
      const prev = prevPaused.current.get(quote.pair);
      if (prev !== undefined && prev !== quote.paused) {
        entries.push(
          makeLogEntry(
            quote.paused ? 'warning' : 'info',
            `${quote.pair} quoting ${quote.paused ? 'PAUSED' : 'RESUMED'}`
          )
        );
      }
      prevPaused.current.set(quote.pair, quote.paused);
    }

    if (entries.length > 0) {
      dispatch({ type: 'push', entries });
    }
  }, [connected, quotes, killSwitchEngaged]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Event Log</CardTitle>
        <span className="text-xs text-slate-400">{log.length} event{log.length !== 1 ? 's' : ''}</span>
      </CardHeader>
      <CardContent>
        {log.length === 0 ? (
          <p className="text-sm text-slate-400">Waiting for events…</p>
        ) : (
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {log.slice(0, 100).map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 font-mono text-xs">
                <span className="min-w-[5rem] text-slate-500">{entry.time}</span>
                <Badge tone={logLevelTone(entry.level)}>{entry.level}</Badge>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
