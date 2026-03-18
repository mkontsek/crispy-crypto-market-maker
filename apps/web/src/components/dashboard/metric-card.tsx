import type { FC } from 'react';

type MetricCardProps = {
  label: string;
  value: string;
  positive?: boolean;
};

export const MetricCard: FC<MetricCardProps> = ({ label, value, positive }) => (
  <div className="rounded border border-slate-800 p-3">
    <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
    <div
      className={`mt-1 text-base font-semibold ${
        positive === undefined
          ? ''
          : positive
          ? 'text-emerald-400'
          : 'text-red-400'
      }`}
    >
      {value}
    </div>
  </div>
);
