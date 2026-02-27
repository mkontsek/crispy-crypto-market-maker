import { NextResponse } from 'next/server';

import { getRelaySnapshot } from '@/server/engine-relay';

export const runtime = 'nodejs';

export async function GET() {
  const snapshot = getRelaySnapshot();
  return NextResponse.json({
    items: snapshot.pnlHistory,
  });
}
