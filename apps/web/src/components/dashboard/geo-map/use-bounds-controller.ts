import L from 'leaflet';
import type { FC } from 'react';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import type { GeoMapMarker } from './geo-map-section';
import type { MarkerPixelOffset } from './marker-overlap';

type BoundsControllerProps = {
    markers: GeoMapMarker[];
    markerOffsets: MarkerPixelOffset[];
};

const MARKER_WIDTH_PX = 24;
const MARKER_HEIGHT_PX = 36;
const MARKER_MARGIN_PX = 8;
const FIT_PADDING_PX = 24;
const MAX_ZOOM = 6;

/** Re-fits the map bounds whenever markers change. */
export const BoundsController: FC<BoundsControllerProps> = ({
    markers,
    markerOffsets,
}) => {
    const map = useMap();

    useEffect(() => {
        if (markers.length === 0) return;

        const expandedBounds = L.latLngBounds([]);

        for (let index = 0; index < markers.length; index += 1) {
            const marker = markers[index];
            const markerOffset = markerOffsets[index] ?? { x: 0, y: 0 };
            const markerLayerPoint = map.project([marker.lat, marker.lng], 0);

            const anchorX = MARKER_WIDTH_PX / 2 - markerOffset.x;
            const anchorY = MARKER_HEIGHT_PX - markerOffset.y;

            const topLeftPoint = markerLayerPoint.add(
                L.point(-anchorX - MARKER_MARGIN_PX, -anchorY - MARKER_MARGIN_PX)
            );
            const bottomRightPoint = markerLayerPoint.add(
                L.point(
                    MARKER_WIDTH_PX - anchorX + MARKER_MARGIN_PX,
                    MARKER_HEIGHT_PX - anchorY + MARKER_MARGIN_PX
                )
            );

            expandedBounds.extend(map.unproject(topLeftPoint, 0));
            expandedBounds.extend(map.unproject(bottomRightPoint, 0));
        }

        map.fitBounds(expandedBounds, {
            padding: [FIT_PADDING_PX, FIT_PADDING_PX],
            maxZoom: MAX_ZOOM,
        });
    }, [map, markers, markerOffsets]);

    return null;
};
