import type { FC } from 'react';

type DecimalFieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
};

export const DecimalField: FC<DecimalFieldProps> = ({
    label,
    value,
    onChange,
}) => (
    <label className="space-y-1">
        <span className="block text-xs text-slate-400">{label}</span>
        <input
            className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(event.target.value)}
        />
    </label>
);
