import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchDashboardGeo, fetchGeoForUrl } from '../geo-service';

describe('fetchGeoForUrl', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses the server geo route for URL lookups', async () => {
        const payload = { lat: 37.98, lng: 23.72, label: 'Athens, Greece' };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(payload),
        });
        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchGeoForUrl('http://localhost:3110')).resolves.toEqual(
            payload
        );
        expect(fetchMock).toHaveBeenCalledWith(
            '/api/geo?url=http%3A%2F%2Flocalhost%3A3110'
        );
    });

    it('returns null when the server route is unreachable', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new Error('network error'))
        );
        await expect(
            fetchGeoForUrl('http://localhost:3110')
        ).resolves.toBeNull();
    });
});

describe('fetchDashboardGeo', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses the server geo route for dashboard lookups', async () => {
        const payload = { lat: 37.98, lng: 23.72, label: 'Athens, Greece' };
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue(payload),
        });
        vi.stubGlobal('fetch', fetchMock);

        await expect(fetchDashboardGeo()).resolves.toEqual(payload);
        expect(fetchMock).toHaveBeenCalledWith('/api/geo');
    });

    it('returns null when the server geo route returns an error status', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
        await expect(fetchDashboardGeo()).resolves.toBeNull();
    });
});
