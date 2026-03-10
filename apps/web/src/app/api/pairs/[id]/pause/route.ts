import { pairSchema, pausePairRequestSchema } from '@crispy/shared';
import { NextResponse } from 'next/server';

import { forwardEnginePost } from '@/server/engine-http';
import { sanitize } from '@/lib/sanitize';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsedPair = pairSchema.safeParse(sanitize(id));
  if (!parsedPair.success) {
    return NextResponse.json(
      {
        error: 'invalid pair id',
        details: parsedPair.error.flatten(),
      },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = pausePairRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid pause payload',
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const response = await forwardEnginePost(
      `/pairs/${encodeURIComponent(parsedPair.data)}/pause`,
      parsed.data
    );
    return NextResponse.json(response.body, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'failed to pause pair via engine',
        details: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 502 }
    );
  }
}
