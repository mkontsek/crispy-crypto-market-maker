export function inventorySkewColor(skew: number): string {
    const abs = Math.abs(skew);
    if (abs < 0.4) return 'bg-emerald-500';
    if (abs < 0.8) return 'bg-amber-500';
    return 'bg-red-500';
}

export function inventorySkewWidth(skew: number): string {
    const abs = Math.abs(skew);
    if (abs < 0.01) return 'w-0';
    if (abs < 0.25) return 'w-1/4';
    if (abs < 0.5) return 'w-1/2';
    if (abs < 0.75) return 'w-3/4';
    return 'w-full';
}
