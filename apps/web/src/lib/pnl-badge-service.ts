export type PnlBadgeTone = 'success' | 'danger' | 'default';

export type PnlBadge = {
    tone: PnlBadgeTone;
    arrow: string;
    sign: string;
};

export function derivePnlBadge(value: number): PnlBadge {
    if (value > 0) {
        return { tone: 'success', arrow: '▲', sign: '+' };
    }
    if (value < 0) {
        return { tone: 'danger', arrow: '▼', sign: '' };
    }
    return { tone: 'default', arrow: '–', sign: '' };
}
