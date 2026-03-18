import { describe, expect, it } from 'vitest';

import { logLevelTone, logReducer, makeLogEntry } from '../event-log-service';

describe('makeLogEntry', () => {
  it('creates a log entry with the given level and message', () => {
    const entry = makeLogEntry('info', 'test message');
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('test message');
    expect(typeof entry.id).toBe('number');
    expect(typeof entry.time).toBe('string');
  });

  it('increments id for successive entries', () => {
    const a = makeLogEntry('info', 'a');
    const b = makeLogEntry('warning', 'b');
    expect(b.id).toBeGreaterThan(a.id);
  });
});

describe('logReducer', () => {
  it('prepends new entries to state', () => {
    const existing = [makeLogEntry('info', 'old')];
    const newEntries = [makeLogEntry('warning', 'new')];
    const result = logReducer(existing, { type: 'push', entries: newEntries });
    expect(result[0]?.message).toBe('new');
    expect(result[1]?.message).toBe('old');
  });

  it('caps the log at 200 entries', () => {
    const state = Array.from({ length: 199 }, (_, i) => makeLogEntry('info', `entry ${i}`));
    const newEntries = [makeLogEntry('info', 'new1'), makeLogEntry('info', 'new2')];
    const result = logReducer(state, { type: 'push', entries: newEntries });
    expect(result).toHaveLength(200);
  });

  it('returns state unchanged for unknown actions', () => {
    const state = [makeLogEntry('info', 'existing')];
    // @ts-expect-error testing unknown action
    const result = logReducer(state, { type: 'unknown' });
    expect(result).toBe(state);
  });
});

describe('logLevelTone', () => {
  it('maps critical to danger', () => {
    expect(logLevelTone('critical')).toBe('danger');
  });

  it('maps warning to warning', () => {
    expect(logLevelTone('warning')).toBe('warning');
  });

  it('maps info to default', () => {
    expect(logLevelTone('info')).toBe('default');
  });
});
