import type { FC } from 'react';

type MetricCardProps = {
    label: string;
    value: string;
    positive?: boolean;
};

function getMetricValueClass(positive?: boolean): string {
    if (positive === undefined) return 'mt-1 text-base font-semibold';
    return `mt-1 text-base font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`;
}

export const MetricCard: FC<MetricCardProps> = ({ label, value, positive }) => (
    <div className="rounded border border-slate-800 p-3">
        <div className="text-xs uppercase tracking-wide text-slate-400">
            {label}
        </div>
        <div className={getMetricValueClass(positive)}>{value}</div>
    </div>
);
