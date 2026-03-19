import { describe, expect, it } from 'vitest';

import {
    botUrlsFromDomain,
    buildNewBot,
    cloneTopology,
    defaultBotName,
    domainFromBotUrl,
    domainFromExchangeUrl,
    exchangeUrlsFromDomain,
    nextBotId,
} from '../topology-service';

describe('cloneTopology', () => {
    it('creates a deep copy of topology', () => {
        const topology = {
            exchangeWsUrl: 'wss://ex',
            exchangeHttpUrl: 'https://ex',
            bots: [
                {
                    id: 'bot-1',
                    name: 'Bot 1',
                    wsUrl: 'wss://bot',
                    httpUrl: 'https://bot',
                },
            ],
        };
        const clone = cloneTopology(topology);
        expect(clone).toEqual(topology);
        expect(clone).not.toBe(topology);
        expect(clone.bots[0]).not.toBe(topology.bots[0]);
    });
});

describe('defaultBotName', () => {
    it('returns Bot with suffix for bot-N ids', () => {
        expect(defaultBotName('bot-1')).toBe('Bot 1');
        expect(defaultBotName('bot-2')).toBe('Bot 2');
    });

    it('returns Bot for unknown ids', () => {
        expect(defaultBotName('bot-')).toBe('Bot');
        expect(defaultBotName('unknown')).toBe('Bot unknown');
    });
});

describe('nextBotId', () => {
    it('returns bot-1 for empty list', () => {
        expect(nextBotId([])).toBe('bot-1');
    });

    it('returns next sequential id', () => {
        const bots = [{ id: 'bot-1', name: 'Bot 1', wsUrl: '', httpUrl: '' }];
        expect(nextBotId(bots)).toBe('bot-2');
    });

    it('skips already used ids', () => {
        const bots = [
            { id: 'bot-1', name: 'Bot 1', wsUrl: '', httpUrl: '' },
            { id: 'bot-2', name: 'Bot 2', wsUrl: '', httpUrl: '' },
        ];
        expect(nextBotId(bots)).toBe('bot-3');
    });
});

describe('domainFromBotUrl', () => {
    it('extracts hostname from a wss URL', () => {
        expect(domainFromBotUrl('wss://bot-joe.sabercrown.com/stream')).toBe(
            'bot-joe.sabercrown.com'
        );
    });

    it('extracts host with port from a ws URL', () => {
        expect(domainFromBotUrl('ws://127.0.0.1:3110/stream')).toBe(
            '127.0.0.1:3110'
        );
    });

    it('returns the value unchanged for invalid URLs', () => {
        expect(domainFromBotUrl('not-a-url')).toBe('not-a-url');
    });
});

describe('botUrlsFromDomain', () => {
    it('creates wss and https URLs from a domain', () => {
        const { wsUrl, httpUrl } = botUrlsFromDomain('bot-joe.sabercrown.com');
        expect(wsUrl).toBe('wss://bot-joe.sabercrown.com/stream');
        expect(httpUrl).toBe('https://bot-joe.sabercrown.com');
    });

    it('trims whitespace from the domain', () => {
        const { wsUrl, httpUrl } = botUrlsFromDomain(
            '  bot-joe.sabercrown.com  '
        );
        expect(wsUrl).toBe('wss://bot-joe.sabercrown.com/stream');
        expect(httpUrl).toBe('https://bot-joe.sabercrown.com');
    });

    it('strips protocol prefixes if user pastes a full URL', () => {
        const { wsUrl, httpUrl } = botUrlsFromDomain(
            'https://bot-joe.sabercrown.com'
        );
        expect(wsUrl).toBe('wss://bot-joe.sabercrown.com/stream');
        expect(httpUrl).toBe('https://bot-joe.sabercrown.com');
    });
});

describe('domainFromExchangeUrl', () => {
    it('extracts hostname from a wss URL', () => {
        expect(
            domainFromExchangeUrl('wss://exchange-nancy.sabercrown.com/feed')
        ).toBe('exchange-nancy.sabercrown.com');
    });

    it('extracts host with port from a ws URL', () => {
        expect(domainFromExchangeUrl('ws://127.0.0.1:3111/feed')).toBe(
            '127.0.0.1:3111'
        );
    });

    it('returns the value unchanged for invalid URLs', () => {
        expect(domainFromExchangeUrl('not-a-url')).toBe('not-a-url');
    });
});

describe('exchangeUrlsFromDomain', () => {
    it('creates wss and https URLs from a domain', () => {
        const { wsUrl, httpUrl } = exchangeUrlsFromDomain(
            'exchange-nancy.sabercrown.com'
        );
        expect(wsUrl).toBe('wss://exchange-nancy.sabercrown.com/feed');
        expect(httpUrl).toBe('https://exchange-nancy.sabercrown.com');
    });

    it('trims whitespace from the domain', () => {
        const { wsUrl, httpUrl } = exchangeUrlsFromDomain(
            '  exchange-nancy.sabercrown.com  '
        );
        expect(wsUrl).toBe('wss://exchange-nancy.sabercrown.com/feed');
        expect(httpUrl).toBe('https://exchange-nancy.sabercrown.com');
    });

    it('strips protocol prefixes if user pastes a full URL', () => {
        const { wsUrl, httpUrl } = exchangeUrlsFromDomain(
            'https://exchange-nancy.sabercrown.com'
        );
        expect(wsUrl).toBe('wss://exchange-nancy.sabercrown.com/feed');
        expect(httpUrl).toBe('https://exchange-nancy.sabercrown.com');
    });
});

describe('buildNewBot', () => {
    it('creates a new bot with a unique id', () => {
        const bots = [{ id: 'bot-1', name: 'Bot 1', wsUrl: '', httpUrl: '' }];
        const newBot = buildNewBot(bots);
        expect(newBot.id).toBe('bot-2');
        expect(newBot.name).toBe('Bot 2');
        expect(newBot.wsUrl).toContain('wss://');
        expect(newBot.httpUrl).toContain('https://');
    });
});
