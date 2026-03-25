import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AlertWebhookPayload } from '../webhook-notification-service';
import { sendAlertWebhook } from '../webhook-notification-service';

describe('sendAlertWebhook', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('POSTs JSON to the given URL with the correct headers', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(
            new Response(null, { status: 200 })
        );

        const payload: AlertWebhookPayload = {
            botId: 'bot-1',
            botName: 'Joe',
            newAlerts: [
                { id: 'kill-switch', severity: 'critical', message: 'Kill switch is ENGAGED' },
            ],
            resolvedAlertIds: [],
            timestamp: '2026-01-01T00:00:00.000Z',
        };

        await sendAlertWebhook('https://hooks.example.com/alerts', payload);

        expect(mockFetch).toHaveBeenCalledOnce();
        const [url, init] = mockFetch.mock.calls[0]!;
        expect(url).toBe('https://hooks.example.com/alerts');
        expect(init?.method).toBe('POST');
        expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
            'application/json'
        );
        expect(JSON.parse(init?.body as string)).toEqual(payload);
    });

    it('includes resolved alert IDs in the payload', async () => {
        const mockFetch = vi.mocked(fetch);
        mockFetch.mockResolvedValueOnce(
            new Response(null, { status: 200 })
        );

        const payload: AlertWebhookPayload = {
            botId: 'bot-1',
            botName: 'Joe',
            newAlerts: [],
            resolvedAlertIds: ['exchange-disconnect', 'feed-stale'],
            timestamp: '2026-01-01T00:00:00.000Z',
        };

        await sendAlertWebhook('https://hooks.example.com/alerts', payload);

        const [, init] = vi.mocked(fetch).mock.calls[0]!;
        const body = JSON.parse(init?.body as string) as AlertWebhookPayload;
        expect(body.resolvedAlertIds).toEqual([
            'exchange-disconnect',
            'feed-stale',
        ]);
        expect(body.newAlerts).toHaveLength(0);
    });

    it('throws when the server returns a non-OK status', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(
            new Response(null, { status: 500 })
        );

        await expect(
            sendAlertWebhook('https://hooks.example.com/alerts', {
                botId: 'bot-1',
                botName: 'Joe',
                newAlerts: [],
                resolvedAlertIds: [],
                timestamp: '2026-01-01T00:00:00.000Z',
            })
        ).rejects.toThrow('Alert webhook returned HTTP 500');
    });

    it('throws when the network request fails', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        await expect(
            sendAlertWebhook('https://hooks.example.com/alerts', {
                botId: 'bot-1',
                botName: 'Joe',
                newAlerts: [],
                resolvedAlertIds: [],
                timestamp: '2026-01-01T00:00:00.000Z',
            })
        ).rejects.toThrow('Network error');
    });
});
