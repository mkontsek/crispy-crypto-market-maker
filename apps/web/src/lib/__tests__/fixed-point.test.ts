import { describe, expect, it } from 'vitest';

import { priceFromFp, ratioFromDecimal, sizeFromFp } from '../fixed-point';

describe('priceFromFp', () => {
  it('converts a decimal string to a number', () => {
    expect(priceFromFp('62000')).toBe(62000);
    expect(priceFromFp('3450.75')).toBe(3450.75);
    expect(priceFromFp('0')).toBe(0);
  });

  it('handles negative values', () => {
    expect(priceFromFp('-100.5')).toBe(-100.5);
  });
});

describe('sizeFromFp', () => {
  it('converts a decimal string to a number', () => {
    expect(sizeFromFp('0.5')).toBe(0.5);
    expect(sizeFromFp('1')).toBe(1);
    expect(sizeFromFp('0.000001')).toBeCloseTo(0.000001);
  });
});

describe('ratioFromDecimal', () => {
  it('converts a ratio string to a number', () => {
    expect(ratioFromDecimal('0.35')).toBe(0.35);
    expect(ratioFromDecimal('1')).toBe(1);
    expect(ratioFromDecimal('0')).toBe(0);
  });
});
