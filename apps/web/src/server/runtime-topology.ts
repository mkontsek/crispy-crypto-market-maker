import {
  DEFAULT_BOT_ID,
  DEFAULT_ENGINE_HTTP_URL,
  DEFAULT_ENGINE_WS_URL,
  DEFAULT_EXCHANGE_HTTP_URL,
  DEFAULT_EXCHANGE_WS_URL,
  runtimeTopologySchema,
  type BotId,
  type ExchangeTopology,
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

function buildInitialTopology(): RuntimeTopology {
  return runtimeTopologySchema.parse({
    exchangeWsUrl: canonicalUrl(
      process.env.EXCHANGE_WS_URL ?? DEFAULT_EXCHANGE_WS_URL
    ),
    exchangeHttpUrl: canonicalUrl(
      process.env.EXCHANGE_HTTP_URL ?? DEFAULT_EXCHANGE_HTTP_URL
    ),
    bots: [
      {
        id: DEFAULT_BOT_ID,
        name: process.env.BOT_1_NAME?.trim() || botNameFromId(DEFAULT_BOT_ID),
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
      },
    ],
  });
}

let topologyState: RuntimeTopology = buildInitialTopology();

function cloneTopology(topology: RuntimeTopology): RuntimeTopology {
  return {
    exchangeWsUrl: topology.exchangeWsUrl,
    exchangeHttpUrl: topology.exchangeHttpUrl,
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
    bots: next.bots.map((bot) => ({
      id: bot.id,
      name: bot.name.trim() || botNameFromId(bot.id),
      wsUrl: canonicalUrl(bot.wsUrl),
      httpUrl: canonicalUrl(bot.httpUrl),
    })),
  });

  topologyState = {
    exchangeWsUrl: validated.exchangeWsUrl,
    exchangeHttpUrl: validated.exchangeHttpUrl,
    bots: validated.bots.map((bot) => ({ ...bot })),
  };

  return getRuntimeTopology();
}
