import type { GeoLocation } from '@crispy/shared';

export function TextField({
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
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

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

export function LocationFields({
  location,
  onChangeField,
}: {
  location: GeoLocation | undefined;
  onChangeField: (field: keyof GeoLocation, value: string) => void;
}) {
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs text-slate-400">
        Location (optional — shown on Infrastructure Map)
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <NumberField
          label="Latitude"
          value={location?.lat ?? ''}
          onChange={(v) => onChangeField('lat', v)}
        />
        <NumberField
          label="Longitude"
          value={location?.lng ?? ''}
          onChange={(v) => onChangeField('lng', v)}
        />
        <TextField
          label="Location label"
          value={location?.label ?? ''}
          onChange={(v) => onChangeField('label', v)}
        />
      </div>
    </div>
  );
}
