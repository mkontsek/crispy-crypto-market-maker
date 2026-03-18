import type { GeoMapMarker } from './geo-map-section';

export interface MarkerPixelOffset {
    x: number;
    y: number;
}

const OVERLAP_RADIUS_PX = 12;
const COORDINATE_PRECISION = 6;

function markerCoordinateKey(marker: GeoMapMarker): string {
    return `${marker.lat.toFixed(COORDINATE_PRECISION)}:${marker.lng.toFixed(COORDINATE_PRECISION)}`;
}

function radialOffset(
    index: number,
    total: number,
    radius: number
): MarkerPixelOffset {
    const angle = (2 * Math.PI * index) / total;
    return {
        x: Math.round(Math.cos(angle) * radius),
        y: Math.round(Math.sin(angle) * radius),
    };
}

export function buildMarkerPixelOffsets(
    markers: GeoMapMarker[]
): MarkerPixelOffset[] {
    const offsets = markers.map(() => ({ x: 0, y: 0 }));
    const groups = new Map<string, number[]>();

    markers.forEach((marker, index) => {
        const key = markerCoordinateKey(marker);
        const existing = groups.get(key);
        if (existing) {
            existing.push(index);
        } else {
            groups.set(key, [index]);
        }
    });

    for (const indices of groups.values()) {
        if (indices.length <= 1) continue;

        const dashboardIndex = indices.find(
            (index) => markers[index]?.kind === 'dashboard'
        );
        const orbitingIndices =
            dashboardIndex === undefined
                ? indices
                : indices.filter((index) => index !== dashboardIndex);

        orbitingIndices.forEach((index, orbitIndex) => {
            offsets[index] = radialOffset(
                orbitIndex,
                orbitingIndices.length,
                OVERLAP_RADIUS_PX
            );
        });
    }

    return offsets;
}
