import { describe, expect, it } from 'vitest';

import { resolveNetworkFirstCacheFallback } from '../query-cache-fallback';

describe('resolveNetworkFirstCacheFallback', () => {
    it('returns network data when network result is not empty', () => {
        const networkData = { items: [1, 2] };
        const cachedData = { items: [9] };

        const result = resolveNetworkFirstCacheFallback({
            networkData,
            cachedData,
            isNetworkEmpty: (data) => data.items.length === 0,
        });

        expect(result).toBe(networkData);
    });

    it('returns cached data when network result is empty and cache has values', () => {
        const networkData = { items: [] as number[] };
        const cachedData = { items: [9] };

        const result = resolveNetworkFirstCacheFallback({
            networkData,
            cachedData,
            isNetworkEmpty: (data) => data.items.length === 0,
        });

        expect(result).toBe(cachedData);
    });

    it('returns network data when both network and cache are empty', () => {
        const networkData = { items: [] as number[] };
        const cachedData = { items: [] as number[] };

        const result = resolveNetworkFirstCacheFallback({
            networkData,
            cachedData,
            isNetworkEmpty: (data) => data.items.length === 0,
        });

        expect(result).toBe(networkData);
    });

    it('returns network data when cache is undefined', () => {
        const networkData = { items: [] as number[] };

        const result = resolveNetworkFirstCacheFallback({
            networkData,
            cachedData: undefined,
            isNetworkEmpty: (data) => data.items.length === 0,
        });

        expect(result).toBe(networkData);
    });
});
