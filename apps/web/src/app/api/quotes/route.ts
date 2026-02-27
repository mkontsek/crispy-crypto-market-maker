import { NextResponse } from 'next/server';

import { getRelaySnapshot } from '@/server/engine-relay';

export const runtime = 'nodejs';

export async function GET() {
  const snapshot = getRelaySnapshot();
  return NextResponse.json({
    connected: snapshot.connected,
    updatedAt: snapshot.lastUpdated,
    quotes: snapshot.quotes,
    quoteHistory: snapshot.quoteHistory,
    exchangeHealth: snapshot.exchangeHealth,
    config: snapshot.config,
  });
}
