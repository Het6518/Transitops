import { useState, useEffect, useRef } from 'react';

/**
 * Geocode a place name to [lat, lng] using Nominatim (free, no key needed).
 * Results are cached in a module-level Map to avoid redundant requests.
 */
const geocodeCache = new Map();

async function geocode(placeName) {
  if (geocodeCache.has(placeName)) return geocodeCache.get(placeName);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName)}&format=json&limit=1`;
  const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } });
  const data = await res.json();
  if (!data.length) throw new Error(`Could not geocode: ${placeName}`);
  const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  geocodeCache.set(placeName, coords);
  return coords;
}

/**
 * Fetch a driving route from OSRM (free, public demo server).
 * Returns an array of [lat, lng] waypoints.
 */
async function fetchOsrmRoute(srcCoords, dstCoords) {
  const [srcLat, srcLng] = srcCoords;
  const [dstLat, dstLng] = dstCoords;
  const url = `https://router.project-osrm.org/route/v1/driving/${srcLng},${srcLat};${dstLng},${dstLat}?overview=full&geometries=geojson&annotations=false`;
  const res  = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('OSRM routing failed');
  const route = data.routes[0];
  // Convert GeoJSON [lng, lat] → [lat, lng]
  const waypoints = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationMin = Math.round(route.duration / 60);
  return { waypoints, distanceKm, durationMin };
}

/**
 * useTripRoute
 * ─────────────
 * Resolves source/destination city names → coordinates → OSRM route.
 * Returns: { srcCoords, dstCoords, routePoints, distanceKm, durationMin, loading, error }
 */
export function useTripRoute(source, destination) {
  const [state, setState] = useState({
    srcCoords: null,
    dstCoords: null,
    routePoints: [],
    distanceKm: null,
    durationMin: null,
    loading: true,
    error: null,
  });

  const abortRef = useRef(false);

  useEffect(() => {
    if (!source || !destination) return;
    abortRef.current = false;
    setState(s => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const [srcCoords, dstCoords] = await Promise.all([
          geocode(source),
          geocode(destination),
        ]);
        if (abortRef.current) return;

        let routePoints = [];
        let distanceKm  = null;
        let durationMin = null;

        try {
          const r = await fetchOsrmRoute(srcCoords, dstCoords);
          routePoints = r.waypoints;
          distanceKm  = r.distanceKm;
          durationMin = r.durationMin;
        } catch {
          // Routing failed — fall back to straight line
          routePoints = [srcCoords, dstCoords];
        }

        if (abortRef.current) return;
        setState({ srcCoords, dstCoords, routePoints, distanceKm, durationMin, loading: false, error: null });
      } catch (err) {
        if (abortRef.current) return;
        setState(s => ({ ...s, loading: false, error: err.message }));
      }
    })();

    return () => { abortRef.current = true; };
  }, [source, destination]);

  return state;
}
