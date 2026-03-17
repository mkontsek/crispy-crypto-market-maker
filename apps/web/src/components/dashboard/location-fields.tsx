'use client';

import type { GeoLocation } from '@crispy/shared';

import { NumberField } from './number-field';
import { TextField } from './text-field';

export function LocationFields({
  location,
  onChangeField,
}: {
  location: GeoLocation | undefined;
  onChangeField: (field: keyof GeoLocation, value: string) => void;
}) {
  return (
    <div className="mt-3">
      <div className="mb-1">
        <span className="text-xs text-slate-400">
          Location (optional — overrides auto-detected position on Infrastructure Map)
        </span>
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

