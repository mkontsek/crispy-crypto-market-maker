import type { FC } from 'react';

type PnlChartProps = { values: number[] };

export const PnlChart: FC<PnlChartProps> = ({ values }) => {
    if (values.length < 2) {
        return (
            <p className="py-4 text-center text-sm text-slate-400">
                Collecting data…
            </p>
        );
    }

    const W = 400;
    const H = 80;
    const PAD = 4;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const pts = values
        .map((v, i) => {
            const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
            const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');

    const current = values[values.length - 1] ?? 0;
    const zeroY = PAD + (1 - (0 - min) / range) * (H - PAD * 2);
    const clampedZeroY = Math.min(Math.max(zeroY, PAD), H - PAD);

    return (
        <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            style={{ height: '80px' }}
            aria-hidden="true"
        >
            <line
                x1={PAD}
                y1={clampedZeroY}
                x2={W - PAD}
                y2={clampedZeroY}
                stroke="#334155"
                strokeWidth="0.5"
                strokeDasharray="4,4"
            />
            <polyline
                points={pts}
                fill="none"
                stroke={current >= 0 ? '#10b981' : '#ef4444'}
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
};
