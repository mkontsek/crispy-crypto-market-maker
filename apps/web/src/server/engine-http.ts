import { DEFAULT_ENGINE_HTTP_URL } from '@crispy/shared';

const engineHttpUrl = process.env.ENGINE_HTTP_URL ?? DEFAULT_ENGINE_HTTP_URL;

export async function forwardEnginePost(path: string, payload: unknown) {
  const response = await fetch(`${engineHttpUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let body: unknown = null;
  if (text.length > 0) {
    body = JSON.parse(text);
  }

  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}
