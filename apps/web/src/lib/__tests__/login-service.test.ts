import { describe, expect, it } from 'vitest';

import { resolveNextPath } from '../login-service';

describe('resolveNextPath', () => {
  it('returns /dashboard for null', () => {
    expect(resolveNextPath(null)).toBe('/dashboard');
  });

  it('returns /dashboard for empty string', () => {
    expect(resolveNextPath('')).toBe('/dashboard');
  });

  it('returns the path for a valid relative path', () => {
    expect(resolveNextPath('/history')).toBe('/history');
    expect(resolveNextPath('/dashboard')).toBe('/dashboard');
  });

  it('returns /dashboard for paths starting with //', () => {
    expect(resolveNextPath('//evil.com')).toBe('/dashboard');
  });

  it('returns /dashboard for absolute URLs', () => {
    expect(resolveNextPath('https://evil.com')).toBe('/dashboard');
  });
});
