import { PRICE_SCALE, SIZE_SCALE } from '@crispy/shared';

export function priceFromFp(value: number) {
  return value / PRICE_SCALE;
}

export function sizeFromFp(value: number) {
  return value / SIZE_SCALE;
}
