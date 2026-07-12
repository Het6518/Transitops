import { useMemo } from 'react';
import { Polyline } from 'react-leaflet';

const STATUS_COLOR = {
  COMPLETED:  '#16a34a',  // green
  DISPATCHED: '#3b82f6',  // blue
  DRAFT:      '#9333ea',  // purple
  CANCELLED:  '#9ca3af',  // gray
};

/**
 * RouteOverlay
 * Draws the driving route polyline on the map.
 * Completed trips: solid green
 * In-progress trips: animated dashed blue
 * Pending/draft: dashed purple
 * Falls back to a dashed straight line if only 2 points are provided.
 */
export default function RouteOverlay({ routePoints, status, isFallback }) {
  const color = STATUS_COLOR[status] ?? '#3b82f6';

  const pathOptions = useMemo(() => {
    const base = { color, weight: isFallback ? 3 : 4.5, lineCap: 'round', lineJoin: 'round' };
    if (isFallback)       return { ...base, dashArray: '8 6', opacity: 0.7 };
    if (status === 'DRAFT') return { ...base, dashArray: '10 6', opacity: 0.75 };
    return { ...base, opacity: 0.9 };
  }, [color, status, isFallback]);

  if (!routePoints || routePoints.length < 2) return null;

  return <Polyline positions={routePoints} pathOptions={pathOptions} />;
}
