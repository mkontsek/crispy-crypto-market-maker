import { describe, expect, it } from 'vitest';

import { nanosToTime } from '../timestamp';

describe('nanosToTime', () => {
  it('converts a nanosecond unix timestamp to HH:MM:SS.mmmmmm', () => {
    // 2024-01-01 00:00:00.000 UTC = 1704067200000 ms = 1704067200000000000 ns
    const nanos = '1704067200000000000';
    expect(nanosToTime(nanos)).toBe('00:00:00.000000');
  });

  it('includes sub-millisecond microseconds precision', () => {
    // 1704067200000123456 ns → ms=1704067200000, subMs=123456
    // micros = floor(123456 / 1000) = 123
    const nanos = '1704067200000123456';
    expect(nanosToTime(nanos)).toBe('00:00:00.000123');
  });

  it('formats hours, minutes and seconds correctly', () => {
    // 2024-01-01 01:02:03.456 UTC = 1704070923456 ms
    const ms = 1704070923456;
    const nanos = (BigInt(ms) * 1_000_000n).toString();
    expect(nanosToTime(nanos)).toBe('01:02:03.456000');
  });

  it('zero timestamp returns midnight UTC', () => {
    expect(nanosToTime('0')).toBe('00:00:00.000000');
  });
});
