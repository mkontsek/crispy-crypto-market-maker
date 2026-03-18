import type { RuntimeTopology, TopologyBot } from '@crispy/shared';

export function cloneTopology(topology: RuntimeTopology): RuntimeTopology {
    return {
        exchangeWsUrl: topology.exchangeWsUrl,
        exchangeHttpUrl: topology.exchangeHttpUrl,
        bots: topology.bots.map((bot) => ({ ...bot })),
    };
}

export function defaultBotName(botId: string): string {
    const suffix = botId.replace(/^bot-/, '').replace(/-/g, ' ').trim();
    return suffix.length > 0 ? `Bot ${suffix}` : 'Bot';
}

export function nextBotId(existingBots: TopologyBot[]): string {
    const existingIds = new Set(existingBots.map((bot) => bot.id));
    let counter = existingBots.length + 1;
    while (existingIds.has(`bot-${counter}`)) {
        counter += 1;
    }
    return `bot-${counter}`;
}

export function buildNewBot(existingBots: TopologyBot[]): TopologyBot {
    const botId = nextBotId(existingBots);
    return {
        id: botId,
        name: defaultBotName(botId),
        wsUrl: `wss://${botId}.example.com/stream`,
        httpUrl: `https://${botId}.example.com`,
    };
}
