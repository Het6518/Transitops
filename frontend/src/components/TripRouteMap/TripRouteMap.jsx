/**
 * TripRouteMap
 * ─────────────
 * Interactive Leaflet map embedded in the Trip Details drawer.
 * Geocodes source/destination, fetches an OSRM driving route, and renders:
 *  - OpenStreetMap base layer
 *  - Custom SVG source (green) & destination (red) markers with popups
 *  - Driving route polyline (colour/style based on trip status)
 *  - Floating info card (distance, duration, vehicle, driver, status)
 *
 * Uses lazy-import (React.lazy is not used here to keep it simple — instead
 * the component is only mounted when the drawer is open, so Leaflet only
 * initialises on demand).
 *
 * Leaflet CSS is injected dynamically the first time this component mounts.
 */

import { useEffect, useRef, memo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { useTripRoute }  from './useTripRoute';
import RouteMarkers      from './RouteMarkers';
import RouteOverlay      from './RouteOverlay';
import RouteInfoCard     from './RouteInfoCard';
import LoadingMap        from './LoadingMap';

/* ── Fix Leaflet's default icon path broken by bundlers ─────────────────── */
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl       from 'leaflet/dist/images/marker-icon.png';
import shadowUrl     from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

/* ── Sub-component: fits the map to the route bounds ────────────────────── */
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length < 2) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

/* ── Dashed fallback line when routing fails ────────────────────────────── */
function FallbackLine({ src, dst }) {
  const { Polyline } = require('react-leaflet');
  return (
    <Polyline
      positions={[src, dst]}
      pathOptions={{ color: '#9333ea', weight: 2.5, dashArray: '8 5', opacity: 0.7 }}
    />
  );
}

/* ── Error state inside the map card ────────────────────────────────────── */
function MapError({ src, dst }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-center bg-red-50 dark:bg-red-900/10 rounded-xl p-6">
      <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm font-semibold text-red-600">Unable to load the driving route</p>
      <p className="text-xs text-red-400">
        Could not resolve coordinates for "{src}" or "{dst}". Check the city names.
      </p>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
function TripRouteMap({ trip }) {
  const { source, destination, status } = trip;

  const {
    srcCoords,
    dstCoords,
    routePoints,
    distanceKm,
    durationMin,
    loading,
    error,
  } = useTripRoute(source, destination);

  // Detect if we fell back to a straight line (only 2 points = no real route)
  const isFallback = !loading && !error && routePoints.length === 2;

  // Map height: responsive via CSS classes, but we set a min-height in style
  const mapRef = useRef(null);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
        Trip Route
      </h3>

      <div
        className="relative rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-brand-dark"
        style={{ height: 'clamp(300px, 45vh, 500px)' }}
      >
        {/* Loading overlay */}
        {loading && <LoadingMap />}

        {/* Hard geocode error — no coords at all */}
        {!loading && error && srcCoords === null && (
          <MapError src={source} dst={destination} />
        )}

        {/* Map — render as soon as we have at least one coord */}
        {!loading && srcCoords && dstCoords && (
          <>
            <MapContainer
              ref={mapRef}
              center={srcCoords}
              zoom={7}
              scrollWheelZoom
              className="w-full h-full"
              zoomControl
            >
              {/* Base tile layer — OpenStreetMap */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Fit map to route bounds */}
              <FitBounds points={routePoints.length >= 2 ? routePoints : [srcCoords, dstCoords]} />

              {/* Driving route (or fallback straight line) */}
              {routePoints.length >= 2 && (
                <RouteOverlay
                  routePoints={routePoints}
                  status={status}
                  isFallback={isFallback}
                />
              )}

              {/* Source & destination markers */}
              <RouteMarkers
                trip={trip}
                srcCoords={srcCoords}
                dstCoords={dstCoords}
              />
            </MapContainer>

            {/* Floating info card — outside MapContainer to avoid Leaflet z-index conflicts */}
            <RouteInfoCard
              trip={trip}
              distanceKm={distanceKm}
              durationMin={durationMin}
              isFallback={isFallback}
            />
          </>
        )}

        {/* Routing error but coords OK — show fallback note */}
        {!loading && error && srcCoords && dstCoords && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[1000] bg-orange-50 border border-orange-200 text-orange-600 text-xs px-3 py-1.5 rounded-full shadow font-semibold pointer-events-none">
            ⚠ Route unavailable — showing straight line
          </div>
        )}
      </div>

      {/* Status hint below map */}
      {!loading && !error && status === 'DRAFT' && (
        <div className="flex items-center gap-2 text-xs text-purple-600 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg px-3 py-2">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Route planned. Trip has not started yet.
        </div>
      )}
    </div>
  );
}

export default memo(TripRouteMap);
