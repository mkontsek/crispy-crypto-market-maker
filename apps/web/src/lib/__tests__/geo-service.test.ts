import { describe, expect, it } from 'vitest';

import { isLocalhostHostname } from '../geo-service';

describe('isLocalhostHostname', () => {
  it('detects localhost', () => {
    expect(isLocalhostHostname('localhost')).toBe(true);
    expect(isLocalhostHostname('LOCALHOST')).toBe(true);
  });

  it('detects 127.0.0.1', () => {
    expect(isLocalhostHostname('127.0.0.1')).toBe(true);
  });

  it('detects IPv6 loopback', () => {
    expect(isLocalhostHostname('::1')).toBe(true);
    expect(isLocalhostHostname('[::1]')).toBe(true);
  });

  it('detects .localhost subdomains', () => {
    expect(isLocalhostHostname('bot.localhost')).toBe(true);
    expect(isLocalhostHostname('my.app.localhost')).toBe(true);
  });

  it('returns false for non-local hostnames', () => {
    expect(isLocalhostHostname('example.com')).toBe(false);
    expect(isLocalhostHostname('192.168.1.1')).toBe(false);
    expect(isLocalhostHostname('bot.example.com')).toBe(false);
  });
});
