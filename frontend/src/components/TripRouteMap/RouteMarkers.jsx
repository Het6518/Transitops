import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/** Build an SVG-based pin icon inline (no image file dependency). */
function svgIcon(color, letter) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 26 16 26S32 28 32 16C32 7.163 24.837 0 16 0z"
        fill="${color}" stroke="white" stroke-width="1.5"/>
      <circle cx="16" cy="16" r="8" fill="white" opacity="0.92"/>
      <text x="16" y="21" text-anchor="middle" font-size="10" font-weight="700"
        font-family="sans-serif" fill="${color}">${letter}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -44],
  });
}

/**
 * RouteMarkers
 * Renders source (green) and destination (red) markers with popups.
 */
export default function RouteMarkers({ trip, srcCoords, dstCoords }) {
  const srcIcon = useMemo(() => svgIcon('#16a34a', 'A'), []);
  const dstIcon = useMemo(() => svgIcon('#dc2626', 'B'), []);

  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

  return (
    <>
      {/* Source marker */}
      <Marker position={srcCoords} icon={srcIcon}>
        <Popup className="trip-popup">
          <div className="min-w-[160px]">
            <p className="font-bold text-sm text-green-700 mb-1">🟢 Source</p>
            <p className="font-semibold text-base">{trip.source}</p>
            <p className="text-xs text-gray-500 mt-1">
              Departure: {fmt(trip.dispatchedAt) !== '—' ? fmt(trip.dispatchedAt) : 'Not dispatched'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
              {srcCoords[0].toFixed(4)}, {srcCoords[1].toFixed(4)}
            </p>
          </div>
        </Popup>
      </Marker>

      {/* Destination marker */}
      <Marker position={dstCoords} icon={dstIcon}>
        <Popup className="trip-popup">
          <div className="min-w-[160px]">
            <p className="font-bold text-sm text-red-600 mb-1">🔴 Destination</p>
            <p className="font-semibold text-base">{trip.destination}</p>
            <p className="text-xs text-gray-500 mt-1">
              {trip.completedAt ? `Arrived: ${fmt(trip.completedAt)}` : 'ETA: In Progress'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
              {dstCoords[0].toFixed(4)}, {dstCoords[1].toFixed(4)}
            </p>
          </div>
        </Popup>
      </Marker>
    </>
  );
}
