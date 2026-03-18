import {
    DEFAULT_BOT_ID,
    DEFAULT_ENGINE_HTTP_URL,
    DEFAULT_ENGINE_WS_URL,
    DEFAULT_EXCHANGE_HTTP_URL,
    DEFAULT_EXCHANGE_WS_URL,
    geoLocationSchema,
    runtimeTopologySchema,
    type BotId,
    type ExchangeTopology,
    type GeoLocation,
    type RuntimeTopology,
    type TopologyBot,
} from '@crispy/shared';

function canonicalUrl(url: string) {
    return new URL(url).toString();
}

function botNameFromId(botId: string) {
    const suffix = botId.replace(/^bot-/, '').replace(/-/g, ' ').trim();
    return suffix.length > 0 ? `Bot ${suffix}` : 'Bot';
}

function parseOptionalGeo(
    lat: string | undefined,
    lng: string | undefined,
    label: string | undefined
): GeoLocation | undefined {
    if (lat === undefined || lng === undefined) return undefined;
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const parsed = geoLocationSchema.safeParse({
        lat: latNum,
        lng: lngNum,
        label: label?.trim() || undefined,
    });
    return parsed.success ? parsed.data : undefined;
}

function buildInitialTopology(): RuntimeTopology {
    return runtimeTopologySchema.parse({
        exchangeWsUrl: canonicalUrl(
            process.env.EXCHANGE_WS_URL ?? DEFAULT_EXCHANGE_WS_URL
        ),
        exchangeHttpUrl: canonicalUrl(
            process.env.EXCHANGE_HTTP_URL ?? DEFAULT_EXCHANGE_HTTP_URL
        ),
        exchangeLocation: parseOptionalGeo(
            process.env.EXCHANGE_GEO_LAT,
            process.env.EXCHANGE_GEO_LNG,
            process.env.EXCHANGE_GEO_LABEL
        ),
        dashboardLocation: parseOptionalGeo(
            process.env.DASHBOARD_GEO_LAT,
            process.env.DASHBOARD_GEO_LNG,
            process.env.DASHBOARD_GEO_LABEL
        ),
        bots: [
            {
                id: DEFAULT_BOT_ID,
                name:
                    process.env.BOT_1_NAME?.trim() ||
                    botNameFromId(DEFAULT_BOT_ID),
                wsUrl: canonicalUrl(
                    process.env.BOT_1_WS_URL ??
                        process.env.ENGINE_WS_URL ??
                        DEFAULT_ENGINE_WS_URL
                ),
                httpUrl: canonicalUrl(
                    process.env.BOT_1_HTTP_URL ??
                        process.env.ENGINE_HTTP_URL ??
                        DEFAULT_ENGINE_HTTP_URL
                ),
                location: parseOptionalGeo(
                    process.env.BOT_1_GEO_LAT,
                    process.env.BOT_1_GEO_LNG,
                    process.env.BOT_1_GEO_LABEL
                ),
            },
        ],
    });
}

let topologyState: RuntimeTopology = buildInitialTopology();

function cloneTopology(topology: RuntimeTopology): RuntimeTopology {
    return {
        exchangeWsUrl: topology.exchangeWsUrl,
        exchangeHttpUrl: topology.exchangeHttpUrl,
        exchangeLocation: topology.exchangeLocation,
        dashboardLocation: topology.dashboardLocation,
        bots: topology.bots.map((bot) => ({ ...bot })),
    };
}

export function getRuntimeTopology(): RuntimeTopology {
    return cloneTopology(topologyState);
}

export function getExchangeTopology(): ExchangeTopology {
    return {
        exchangeWsUrl: topologyState.exchangeWsUrl,
        exchangeHttpUrl: topologyState.exchangeHttpUrl,
    };
}

export function resolveBotTopology(botId: BotId): TopologyBot {
    const bot = topologyState.bots.find((entry) => entry.id === botId);
    if (!bot) {
        throw new Error(`unknown bot id: ${botId}`);
    }
    return { ...bot };
}

export function updateRuntimeTopology(next: RuntimeTopology): RuntimeTopology {
    const validated = runtimeTopologySchema.parse({
        exchangeWsUrl: canonicalUrl(next.exchangeWsUrl),
        exchangeHttpUrl: canonicalUrl(next.exchangeHttpUrl),
        exchangeLocation:
            next.exchangeLocation ?? topologyState.exchangeLocation,
        dashboardLocation:
            next.dashboardLocation ?? topologyState.dashboardLocation,
        bots: next.bots.map((bot) => {
            const existing = topologyState.bots.find((b) => b.id === bot.id);
            return {
                id: bot.id,
                name: bot.name.trim() || botNameFromId(bot.id),
                wsUrl: canonicalUrl(bot.wsUrl),
                httpUrl: canonicalUrl(bot.httpUrl),
                location: bot.location ?? existing?.location,
            };
        }),
    });

    topologyState = {
        exchangeWsUrl: validated.exchangeWsUrl,
        exchangeHttpUrl: validated.exchangeHttpUrl,
        exchangeLocation: validated.exchangeLocation,
        dashboardLocation: validated.dashboardLocation,
        bots: validated.bots.map((bot) => ({ ...bot })),
    };

    return getRuntimeTopology();
}
