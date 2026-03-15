export function UrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs text-slate-400">{label}</span>
      <input
        className="h-9 w-full rounded border border-slate-700 bg-slate-900 px-2"
        type="url"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
