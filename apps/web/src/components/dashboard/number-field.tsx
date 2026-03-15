export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <input
        className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
        type="number"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
