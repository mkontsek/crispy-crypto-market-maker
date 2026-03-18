import type { FC } from 'react';

type ConfigNumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export const ConfigNumberField: FC<ConfigNumberFieldProps> = ({ label, value, onChange }) => (
  <label className="space-y-1">
    <span className="block text-xs text-slate-400">{label}</span>
    <input
      className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
    />
  </label>
);
