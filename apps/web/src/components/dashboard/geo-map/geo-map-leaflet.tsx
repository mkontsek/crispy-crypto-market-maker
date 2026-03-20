'use client';

import type { FC } from 'react';
import 'leaflet/dist/leaflet.css';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import type { GeoMapMarker } from './geo-map-section';
import { LegendItem } from './legend-item';
import { buildMarkerPixelOffsets } from './marker-overlap';
import { markerIcon } from './marker-icon';
import { BoundsController } from './use-bounds-controller';

type GeoMapLeafletProps = { markers: GeoMapMarker[] };

const GeoMapLeaflet: FC<GeoMapLeafletProps> = ({ markers }) => {
    const defaultCenter: [number, number] = [20, 10];
    const defaultZoom = 2;
    const markerOffsets = buildMarkerPixelOffsets(markers);

    return (
        <div className="space-y-3">
            <MapContainer
                center={defaultCenter}
                zoom={defaultZoom}
                scrollWheelZoom={false}
                style={{
                    height: '400px',
                    width: '100%',
                    borderRadius: '0.5rem',
                }}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {markers.map((marker, index) => (
                    <Marker
                        key={`${marker.kind}-${marker.label}-${marker.lat}-${marker.lng}-${index}`}
                        position={[marker.lat, marker.lng]}
                        icon={markerIcon(marker, markerOffsets[index])}
                        zIndexOffset={
                            marker.kind === 'bot' || marker.kind === 'dashboard'
                                ? 1000
                                : 0
                        }
                    >
                        <Popup>{marker.label}</Popup>
                    </Marker>
                ))}
                {markers.length > 0 && (
                    <BoundsController
                        markers={markers}
                        markerOffsets={markerOffsets}
                    />
                )}
            </MapContainer>

            <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                <LegendItem color="#22c55e" label="Dashboard" />
                <LegendItem color="#06b6d4" label="Bot" />
                <LegendItem color="#a855f7" label="Simulated exchange" />
                <LegendItem color="#f97316" label="Exchange" />
            </div>
        </div>
    );
};

export default GeoMapLeaflet;
