import { describe, expect, it } from 'vitest';

import { buildNewBot, cloneTopology, defaultBotName, nextBotId } from '../topology-service';

describe('cloneTopology', () => {
  it('creates a deep copy of topology', () => {
    const topology = { exchangeWsUrl: 'wss://ex', exchangeHttpUrl: 'https://ex', bots: [{ id: 'bot-1', name: 'Bot 1', wsUrl: 'wss://bot', httpUrl: 'https://bot' }] };
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
