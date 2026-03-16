export function nanosToTime(nanos: string): string {
  const nanosBI = BigInt(nanos);
  const ms = Number(nanosBI / 1_000_000n);
  const subMs = Number(nanosBI % 1_000_000n);
  const date = new Date(ms);
  const h = date.getUTCHours().toString().padStart(2, '0');
  const m = date.getUTCMinutes().toString().padStart(2, '0');
  const s = date.getUTCSeconds().toString().padStart(2, '0');
  const millis = date.getUTCMilliseconds().toString().padStart(3, '0');
  const micros = Math.floor(subMs / 1000).toString().padStart(3, '0');
  return `${h}:${m}:${s}.${millis}${micros}`;
}
