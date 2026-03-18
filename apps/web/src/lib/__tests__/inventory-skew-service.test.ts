import { describe, expect, it } from 'vitest';

import { inventorySkewColor, inventorySkewWidth } from '../inventory-skew-service';

describe('inventorySkewColor', () => {
  it('returns emerald for low absolute skew', () => {
    expect(inventorySkewColor(0)).toBe('bg-emerald-500');
    expect(inventorySkewColor(0.3)).toBe('bg-emerald-500');
    expect(inventorySkewColor(-0.3)).toBe('bg-emerald-500');
  });

  it('returns amber for moderate absolute skew', () => {
    expect(inventorySkewColor(0.5)).toBe('bg-amber-500');
    expect(inventorySkewColor(-0.5)).toBe('bg-amber-500');
  });

  it('returns red for high absolute skew', () => {
    expect(inventorySkewColor(0.9)).toBe('bg-red-500');
    expect(inventorySkewColor(-0.9)).toBe('bg-red-500');
  });
});

describe('inventorySkewWidth', () => {
  it('returns w-0 for near-zero skew', () => {
    expect(inventorySkewWidth(0)).toBe('w-0');
    expect(inventorySkewWidth(0.005)).toBe('w-0');
  });

  it('returns w-1/4 for small skew', () => {
    expect(inventorySkewWidth(0.1)).toBe('w-1/4');
    expect(inventorySkewWidth(-0.1)).toBe('w-1/4');
  });

  it('returns w-1/2 for medium skew', () => {
    expect(inventorySkewWidth(0.3)).toBe('w-1/2');
    expect(inventorySkewWidth(-0.3)).toBe('w-1/2');
  });

  it('returns w-3/4 for large skew', () => {
    expect(inventorySkewWidth(0.6)).toBe('w-3/4');
    expect(inventorySkewWidth(-0.6)).toBe('w-3/4');
  });

  it('returns w-full for very large skew', () => {
    expect(inventorySkewWidth(0.9)).toBe('w-full');
    expect(inventorySkewWidth(-0.9)).toBe('w-full');
  });
});
