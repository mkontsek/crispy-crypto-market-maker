import type { FC } from 'react';

type LegendItemProps = { color: string; label: string };

export const LegendItem: FC<LegendItemProps> = ({ color, label }) => (
  <span className="flex items-center gap-1.5">
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{ backgroundColor: color }}
    />
    {label}
  </span>
);
