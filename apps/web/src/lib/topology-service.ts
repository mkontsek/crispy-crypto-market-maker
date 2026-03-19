import type { RuntimeTopology, TopologyBot } from '@crispy/shared';

export function cloneTopology(topology: RuntimeTopology): RuntimeTopology {
    const exchangeDomain = domainFromExchangeUrl(topology.exchangeWsUrl);
    const exchangeUrls = exchangeDomain.startsWith('localhost') ? exchangeUrlsFromDomain(exchangeDomain) : { wsUrl: topology.exchangeWsUrl, httpUrl: topology.exchangeHttpUrl };

    return {
        exchangeWsUrl: exchangeUrls.wsUrl,
        exchangeHttpUrl: exchangeUrls.httpUrl,
        bots: topology.bots.map((bot) => {
            const domain = domainFromBotUrl(bot.wsUrl);
            if (domain.startsWith('localhost')) {
                const { wsUrl, httpUrl } = botUrlsFromDomain(domain);
                return { ...bot, wsUrl, httpUrl };
            }
            return { ...bot };
        }),
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

export function domainFromBotUrl(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

export function botUrlsFromDomain(domain: string): {
    wsUrl: string;
    httpUrl: string;
} {
    const trimmed = domain.trim().replace(/^(wss?|https?):\/\//i, '');
    const isLocalhost = trimmed.startsWith('localhost');
    const host = isLocalhost ? `localhost:3110` : trimmed;
    return {
        wsUrl: `${isLocalhost ? 'ws' : 'wss'}://${host}/stream`,
        httpUrl: `${isLocalhost ? 'http' : 'https'}://${host}`,
    };
}

export function domainFromExchangeUrl(url: string): string {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
}

export function exchangeUrlsFromDomain(domain: string): {
    wsUrl: string;
    httpUrl: string;
} {
    const trimmed = domain.trim().replace(/^(wss?|https?):\/\//i, '');
    const isLocalhost = trimmed.startsWith('localhost');
    const host = isLocalhost ? `localhost:3111` : trimmed;
    return {
        wsUrl: `${isLocalhost ? 'ws' : 'wss'}://${host}/feed`,
        httpUrl: `${isLocalhost ? 'http' : 'https'}://${host}`,
    };
}

export function buildNewBot(existingBots: TopologyBot[]): TopologyBot {
    const botId = nextBotId(existingBots);
    const { wsUrl, httpUrl } = botUrlsFromDomain(`${botId}.example.com`);
    return {
        id: botId,
        name: defaultBotName(botId),
        wsUrl,
        httpUrl,
    };
}
