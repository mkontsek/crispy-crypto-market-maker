import { describe, expect, it } from 'vitest';

import { cn } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false && 'b', 'c')).toBe('a c');
    expect(cn('a', undefined, 'c')).toBe('a c');
    expect(cn('a', null, 'c')).toBe('a c');
  });

  it('deduplicates conflicting tailwind classes', () => {
    // tailwind-merge keeps the last one
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('returns empty string when no classes are provided', () => {
    expect(cn()).toBe('');
  });
});
