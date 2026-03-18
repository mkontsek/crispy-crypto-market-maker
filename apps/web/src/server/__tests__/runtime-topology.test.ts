import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    DEFAULT_BOT_ID,
    DEFAULT_ENGINE_HTTP_URL,
    DEFAULT_ENGINE_WS_URL,
    DEFAULT_EXCHANGE_HTTP_URL,
    DEFAULT_EXCHANGE_WS_URL,
} from '@crispy/shared';

describe('runtime-topology', () => {
    // Reset the module between tests so the singleton state_engine is re-initialised.
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('getRuntimeTopology returns a default topology with one bot', async () => {
        const { getRuntimeTopology } = await import('../runtime-topology');
        const topology = getRuntimeTopology();

        expect(topology.bots).toHaveLength(1);
        expect(topology.bots[0]?.id).toBe(DEFAULT_BOT_ID);
    });

    it('getRuntimeTopology returns a clone (mutations do not affect state_engine)', async () => {
        const { getRuntimeTopology } = await import('../runtime-topology');
        const t1 = getRuntimeTopology();

        t1.bots[0]!.name = 'mutated';

        const t2 = getRuntimeTopology();
        expect(t2.bots[0]?.name).not.toBe('mutated');
    });

    it('getExchangeTopology returns exchange WS and HTTP URLs', async () => {
        const { getExchangeTopology } = await import('../runtime-topology');
        const topology = getExchangeTopology();

        expect(topology.exchangeWsUrl).toBeDefined();
        expect(topology.exchangeHttpUrl).toBeDefined();
    });

    it('resolveBotTopology returns the bot for a known id', async () => {
        const { resolveBotTopology } = await import('../runtime-topology');
        const bot = resolveBotTopology(DEFAULT_BOT_ID);

        expect(bot.id).toBe(DEFAULT_BOT_ID);
        expect(bot.wsUrl).toBeDefined();
        expect(bot.httpUrl).toBeDefined();
    });

    it('resolveBotTopology throws for an unknown bot id', async () => {
        const { resolveBotTopology } = await import('../runtime-topology');
        expect(() => resolveBotTopology('bot-unknown' as never)).toThrow(
            'unknown bot id'
        );
    });

    it('updateRuntimeTopology replaces the current topology', async () => {
        const { getRuntimeTopology, updateRuntimeTopology } =
            await import('../runtime-topology');

        const updated = updateRuntimeTopology({
            exchangeWsUrl: DEFAULT_EXCHANGE_WS_URL,
            exchangeHttpUrl: DEFAULT_EXCHANGE_HTTP_URL,
            bots: [
                {
                    id: DEFAULT_BOT_ID,
                    name: 'Updated Bot',
                    wsUrl: DEFAULT_ENGINE_WS_URL,
                    httpUrl: DEFAULT_ENGINE_HTTP_URL,
                },
            ],
        });

        expect(updated.bots[0]?.name).toBe('Updated Bot');
        expect(getRuntimeTopology().bots[0]?.name).toBe('Updated Bot');
    });

    it('updateRuntimeTopology falls back to generated name when name is blank', async () => {
        const { updateRuntimeTopology } = await import('../runtime-topology');

        const updated = updateRuntimeTopology({
            exchangeWsUrl: DEFAULT_EXCHANGE_WS_URL,
            exchangeHttpUrl: DEFAULT_EXCHANGE_HTTP_URL,
            bots: [
                {
                    id: DEFAULT_BOT_ID,
                    name: '   ',
                    wsUrl: DEFAULT_ENGINE_WS_URL,
                    httpUrl: DEFAULT_ENGINE_HTTP_URL,
                },
            ],
        });

        // Should fall back to a generated name derived from the bot id
        expect(updated.bots[0]?.name).toBeTruthy();
        expect(updated.bots[0]?.name.trim()).not.toBe('');
    });
});
