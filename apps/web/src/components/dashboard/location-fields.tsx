'use client';

import type { GeoLocation } from '@crispy/shared';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { NumberField } from './number-field';
import { TextField } from './text-field';

export function LocationFields({
  location,
  httpUrl,
  onChangeField,
}: {
  location: GeoLocation | undefined;
  httpUrl?: string;
  onChangeField: (field: keyof GeoLocation, value: string) => void;
}) {
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const handleAutoDetect = async () => {
    if (!httpUrl) return;
    setDetecting(true);
    setDetectError(null);
    try {
      const resp = await fetch(`/api/geo?url=${encodeURIComponent(httpUrl)}`);
      if (!resp.ok) {
        setDetectError('Auto-detect failed');
        return;
      }
      const data = (await resp.json()) as {
        lat: number;
        lng: number;
        label?: string;
      };
      onChangeField('lat', String(data.lat));
      onChangeField('lng', String(data.lng));
      if (data.label) {
        onChangeField('label', data.label);
      }
    } catch (err) {
      console.error('Auto-detect failed:', err);
      setDetectError('Auto-detect failed');
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-xs text-slate-400">
          Location (optional — shown on Infrastructure Map)
        </span>
        {httpUrl && (
          <Button variant="outline" onClick={handleAutoDetect} disabled={detecting}>
            {detecting ? 'Detecting...' : 'Auto-detect'}
          </Button>
        )}
        {detectError && <span className="text-xs text-red-400">{detectError}</span>}
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

