import { runtimeTopologySchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

import {
    getRuntimeTopology,
    updateRuntimeTopology,
} from '@/server/runtime-topology';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    return NextResponse.json(getRuntimeTopology());
}

export async function POST(request: Request) {
    const body = await request.json();
    const parsed = runtimeTopologySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            {
                error: 'invalid topology payload',
                details: parsed.error.flatten(),
            },
            { status: 400 }
        );
    }

    const updated = updateRuntimeTopology(parsed.data);
    return NextResponse.json(updated);
}
