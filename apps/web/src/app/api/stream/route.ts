import { getRelaySnapshot, subscribeToEngineStream } from '@/server/engine-relay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (value: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`));
      };

      const snapshot = getRelaySnapshot();
      if (snapshot.lastUpdated) {
        send({
          timestamp: snapshot.lastUpdated,
          quotes: snapshot.quotes,
          fills: [],
          inventory: snapshot.inventory,
          pnl: snapshot.pnlHistory[0],
          exchangeHealth: snapshot.exchangeHealth,
          config: snapshot.config,
        });
      }

      const unsubscribe = subscribeToEngineStream((payload) => {
        send(payload);
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
