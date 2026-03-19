import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RuntimeTopology } from '@crispy/shared';

import { buildMarkers, fetchDashboardGeo, fetchGeoForUrl } from '../geo-service';

const BASE_TOPOLOGY: RuntimeTopology = {
    exchangeWsUrl: 'ws://127.0.0.1:3111/feed',
    exchangeHttpUrl: 'http://127.0.0.1:3111/',
    bots: [
        {
            id: 'bot-1',
            name: 'Bot 1',
            wsUrl: 'ws://127.0.0.1:3110/stream',
            httpUrl: 'http://127.0.0.1:3110/',
        },
    ],
};

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

describe('buildMarkers', () => {
    it('uses topology.exchangeLocation over autoGeo for simulated exchange', () => {
        const topology: RuntimeTopology = {
            ...BASE_TOPOLOGY,
            exchangeLocation: { lat: 51.5, lng: -0.1, label: 'London, UK' },
        };
        const autoGeo = new Map([
            ['exchange', { lat: 10.0, lng: 20.0, label: 'Auto' }],
        ]);
        const markers = buildMarkers(topology, autoGeo, null);
        const simEx = markers.find((m) => m.kind === 'simulated-exchange');
        expect(simEx).toMatchObject({ lat: 51.5, lng: -0.1, label: 'London, UK' });
    });

    it('falls back to autoGeo for simulated exchange when topology has no location', () => {
        const autoGeo = new Map([
            ['exchange', { lat: 10.0, lng: 20.0, label: 'Auto Exchange' }],
        ]);
        const markers = buildMarkers(BASE_TOPOLOGY, autoGeo, null);
        const simEx = markers.find((m) => m.kind === 'simulated-exchange');
        expect(simEx).toMatchObject({ lat: 10.0, lng: 20.0, label: 'Auto Exchange' });
    });

    it('uses bot.location from topology over autoGeo', () => {
        const topology: RuntimeTopology = {
            ...BASE_TOPOLOGY,
            bots: [
                {
                    ...BASE_TOPOLOGY.bots[0],
                    location: { lat: 48.8, lng: 2.35, label: 'Paris, FR' },
                },
            ],
        };
        const autoGeo = new Map([['bot-1', { lat: 10.0, lng: 20.0 }]]);
        const markers = buildMarkers(topology, autoGeo, null);
        const bot = markers.find((m) => m.kind === 'bot');
        expect(bot).toMatchObject({ lat: 48.8, lng: 2.35, label: 'Paris, FR' });
    });

    it('uses topology.dashboardLocation over dashboardGeo param', () => {
        const topology: RuntimeTopology = {
            ...BASE_TOPOLOGY,
            dashboardLocation: { lat: 40.7, lng: -74.0, label: 'New York, US' },
        };
        const dashboardGeo = { lat: 1.0, lng: 2.0, label: 'Other' };
        const markers = buildMarkers(topology, new Map(), dashboardGeo);
        const dash = markers.find((m) => m.kind === 'dashboard');
        expect(dash).toMatchObject({
            lat: 40.7,
            lng: -74.0,
            label: 'Dashboard - New York, US',
        });
    });

    it('falls back to dashboardGeo param when topology has no dashboardLocation', () => {
        const dashboardGeo = { lat: 1.0, lng: 2.0, label: 'Somewhere' };
        const markers = buildMarkers(BASE_TOPOLOGY, new Map(), dashboardGeo);
        const dash = markers.find((m) => m.kind === 'dashboard');
        expect(dash).toMatchObject({
            lat: 1.0,
            lng: 2.0,
            label: 'Dashboard - Somewhere',
        });
    });

    it('falls back to exchange geo when no dashboard location is configured', () => {
        const markers = buildMarkers(
            BASE_TOPOLOGY,
            new Map([['exchange', { lat: 10, lng: 20, label: 'Auto' }]]),
            null
        );
        const dash = markers.find((m) => m.kind === 'dashboard');
        expect(dash).toMatchObject({
            lat: 10,
            lng: 20,
            label: 'Dashboard - Auto (inferred)',
        });
    });

    it('falls back to first detected bot geo when exchange geo is unavailable', () => {
        const markers = buildMarkers(
            BASE_TOPOLOGY,
            new Map([['bot-1', { lat: 48.8, lng: 2.35, label: 'Paris, FR' }]]),
            null
        );
        const dash = markers.find((m) => m.kind === 'dashboard');
        expect(dash).toMatchObject({
            lat: 48.8,
            lng: 2.35,
            label: 'Dashboard - Paris, FR (inferred)',
        });
    });
});
