import { getRelaySnapshot, subscribeToEngineStream } from '@/server/engine-relay';
import { parseBotIdFromRequest } from '@/server/bot-target';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(request: Request) {
  const target = parseBotIdFromRequest(request);
  if ('error' in target) {
    return target.error;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (value: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      };

      const snapshot = getRelaySnapshot(target.botId);
      if (snapshot.lastUpdated) {
        send({
          botId: target.botId,
          timestamp: snapshot.lastUpdated,
          quotes: snapshot.quotes,
          fills: [],
          inventory: snapshot.inventory,
          pnl: snapshot.pnlHistory[0],
          exchangeHealth: snapshot.exchangeHealth,
          config: snapshot.config,
        });
      }

      const unsubscribe = subscribeToEngineStream(target.botId, (payload) => {
        send({ botId: target.botId, ...payload });
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 15_000);

      request.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
