import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchJson } from '../fetch-json';

describe('fetchJson', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns parsed JSON when the response is ok', async () => {
        const mockData = { price: '62000', pair: 'BTC/USDT' };
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockData),
            })
        );

        const result = await fetchJson<typeof mockData>(
            'https://example.com/api'
        );
        expect(result).toEqual(mockData);
    });

    it('passes cache: no-store to fetch', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({}),
        });
        vi.stubGlobal('fetch', mockFetch);

        await fetchJson('https://example.com/api');
        expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', {
            cache: 'no-store',
        });
    });

    it('throws when the response status is not ok', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
            })
        );

        await expect(fetchJson('https://example.com/missing')).rejects.toThrow(
            'Request failed: 404'
        );
    });

    it('throws with the actual status code in the error message', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: false,
                status: 503,
            })
        );

        await expect(fetchJson('https://example.com/api')).rejects.toThrow(
            '503'
        );
    });
});
