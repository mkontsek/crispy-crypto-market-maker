import {
  BOT_IDS,
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

const FALLBACK_BOT_2_WS_URL = 'ws://127.0.0.1:9080/stream';
const FALLBACK_BOT_2_HTTP_URL = 'http://127.0.0.1:9081';

const BOT_LABELS: Record<BotId, string> = {
  'bot-1': 'Bot 1',
  'bot-2': 'Bot 2',
};

function canonicalUrl(url: string) {
  return new URL(url).toString();
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
        id: 'bot-1',
        name: BOT_LABELS['bot-1'],
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
      {
        id: 'bot-2',
        name: BOT_LABELS['bot-2'],
        wsUrl: canonicalUrl(process.env.BOT_2_WS_URL ?? FALLBACK_BOT_2_WS_URL),
        httpUrl: canonicalUrl(
          process.env.BOT_2_HTTP_URL ?? FALLBACK_BOT_2_HTTP_URL
        ),
      },
    ],
  });
}

let topologyState: RuntimeTopology = buildInitialTopology();

function orderedBots(bots: TopologyBot[]) {
  const byId = new Map<BotId, TopologyBot>(bots.map((bot) => [bot.id, bot]));
  return BOT_IDS.map((id) => byId.get(id)).filter(
    (bot): bot is TopologyBot => Boolean(bot)
  );
}

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
      name: bot.name.trim() || BOT_LABELS[bot.id],
      wsUrl: canonicalUrl(bot.wsUrl),
      httpUrl: canonicalUrl(bot.httpUrl),
    })),
  });

  topologyState = {
    exchangeWsUrl: validated.exchangeWsUrl,
    exchangeHttpUrl: validated.exchangeHttpUrl,
    bots: orderedBots(validated.bots),
  };

  return getRuntimeTopology();
}
