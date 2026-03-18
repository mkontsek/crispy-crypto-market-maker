import { NextResponse } from 'next/server';

import { getExchangeTopology } from '@/server/runtime-topology';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getExchangeTopology());
}
