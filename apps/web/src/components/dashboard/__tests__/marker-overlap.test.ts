import { describe, expect, it } from 'vitest';

import type { GeoMapMarker } from '../geo-map/geo-map-section';
import { buildMarkerPixelOffsets } from '../geo-map/marker-overlap';

function marker(overrides: Partial<GeoMapMarker>): GeoMapMarker {
  return {
    lat: 40.7128,
    lng: -74.006,
    label: 'Marker',
    kind: 'bot',
    ...overrides,
  };
}

describe('buildMarkerPixelOffsets', () => {
  it('returns zero offsets for markers at unique coordinates', () => {
    const markers: GeoMapMarker[] = [
      marker({ lat: 1, lng: 1, kind: 'dashboard', label: 'Dashboard' }),
      marker({ lat: 2, lng: 2, kind: 'bot', label: 'Bot 1' }),
    ];

    expect(buildMarkerPixelOffsets(markers)).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]);
  });

  it('keeps dashboard centered and offsets co-located bot marker', () => {
    const markers: GeoMapMarker[] = [
      marker({ kind: 'dashboard', label: 'Dashboard' }),
      marker({ kind: 'bot', label: 'Bot 1' }),
    ];

    const offsets = buildMarkerPixelOffsets(markers);
    expect(offsets[0]).toEqual({ x: 0, y: 0 });
    expect(offsets[1]).not.toEqual({ x: 0, y: 0 });
  });

  it('spreads non-dashboard overlaps around the same coordinate', () => {
    const markers: GeoMapMarker[] = [
      marker({ kind: 'bot', label: 'Bot 1' }),
      marker({ kind: 'bot', label: 'Bot 2' }),
      marker({ kind: 'simulated-exchange', label: 'Sim Exchange' }),
    ];

    const offsets = buildMarkerPixelOffsets(markers);
    const unique = new Set(offsets.map((offset) => `${offset.x},${offset.y}`));

    expect(unique.size).toBe(markers.length);
    expect(offsets.every((offset) => offset.x === 0 && offset.y === 0)).toBe(false);
  });
});
