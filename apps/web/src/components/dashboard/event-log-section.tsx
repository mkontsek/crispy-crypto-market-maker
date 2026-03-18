'use client';

import { useEffect, useReducer, useRef } from 'react';

import type { QuoteSnapshot } from '@crispy/shared';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type LogLevel = 'info' | 'warning' | 'critical';
type LogEntry = { id: number; time: string; level: LogLevel; message: string };

let seq = 0;
function makeEntry(level: LogLevel, message: string): LogEntry {
  return { id: seq++, time: new Date().toLocaleTimeString(), level, message };
}

type LogAction = { type: 'push'; entries: LogEntry[] };

function logReducer(state: LogEntry[], action: LogAction): LogEntry[] {
  if (action.type === 'push') {
    return [...action.entries, ...state].slice(0, 200);
  }
  return state;
}

export function EventLogSection({
  connected,
  quotes,
  killSwitchEngaged,
}: {
  connected: boolean;
  quotes: QuoteSnapshot[];
  killSwitchEngaged: boolean;
}) {
  const [log, dispatch] = useReducer(logReducer, []);
  const prevConnected = useRef<boolean | null>(null);
  const prevKillSwitch = useRef<boolean | null>(null);
  const prevPaused = useRef(new Map<string, boolean>());

  useEffect(() => {
    const entries: LogEntry[] = [];

    if (prevConnected.current !== null && prevConnected.current !== connected) {
      entries.push(
        makeEntry(connected ? 'info' : 'critical', connected ? 'Bot stream connected' : 'Bot stream disconnected')
      );
    }
    prevConnected.current = connected;

    if (prevKillSwitch.current !== null && prevKillSwitch.current !== killSwitchEngaged) {
      entries.push(
        makeEntry(
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
          makeEntry(
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

  const levelTone = (level: LogLevel) => {
    if (level === 'critical') return 'danger' as const;
    if (level === 'warning') return 'warning' as const;
    return 'default' as const;
  };

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
                <Badge tone={levelTone(entry.level)}>{entry.level}</Badge>
                <span>{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
