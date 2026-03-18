export type LogLevel = 'info' | 'warning' | 'critical';
export type LogEntry = { id: number; time: string; level: LogLevel; message: string };
export type LogAction = { type: 'push'; entries: LogEntry[] };

let seq = 0;

export function makeLogEntry(level: LogLevel, message: string): LogEntry {
  return { id: seq++, time: new Date().toLocaleTimeString(), level, message };
}

export function logReducer(state: LogEntry[], action: LogAction): LogEntry[] {
  if (action.type === 'push') {
    return [...action.entries, ...state].slice(0, 200);
  }
  return state;
}

export function logLevelTone(level: LogLevel): 'danger' | 'warning' | 'default' {
  if (level === 'critical') return 'danger';
  if (level === 'warning') return 'warning';
  return 'default';
}
