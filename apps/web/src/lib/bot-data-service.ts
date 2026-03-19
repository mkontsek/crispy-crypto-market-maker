import type { Fill, PnLSnapshot } from '@crispy/shared';

export const BOT_REFETCH_INTERVAL_MS = 1_500;

export function dedupeFills(fills: Fill[]): Fill[] {
    const seen = new Set<string>();
    const output: Fill[] = [];
    for (const fill of fills) {
        if (seen.has(fill.id)) continue;
        seen.add(fill.id);
        output.push(fill);
    }
    return output.slice(0, 300);
}

export function dedupePnl(pnl: PnLSnapshot[]): PnLSnapshot[] {
    const seen = new Set<string>();
    const output: PnLSnapshot[] = [];
    for (const row of pnl) {
        if (seen.has(row.timestamp)) continue;
        seen.add(row.timestamp);
        output.push(row);
    }
    return output.slice(0, 300);
}
