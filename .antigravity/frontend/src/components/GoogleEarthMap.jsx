import React, { useEffect, useMemo, useRef, useState } from 'react';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const WORLD_CENTER = { lat: 0, lng: 0, altitude: 0 };

function loadGoogle3D() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.reject(new Error('browser required'));
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  const existing = document.querySelector('script[data-google-maps-3d]');
  if (existing) return new Promise((resolve, reject) => { existing.addEventListener('load', resolve, { once: true }); existing.addEventListener('error', reject, { once: true }); });
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?loading=async&key=${encodeURIComponent(API_KEY)}&libraries=maps3d`;
    script.dataset.googleMaps3d = 'true';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function GoogleEarthMap({ waypoints = [], activeRouteType = 'BALANCED', onFallback }) {
  const host = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('globe');
  const path = useMemo(() => waypoints.filter(p => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])).map(([lat, lng]) => ({ lat, lng })), [waypoints]);

  useEffect(() => {
    let cancelled = false;
    if (!API_KEY) { onFallback?.(); return undefined; }
    loadGoogle3D().then(async () => {
      if (cancelled || !host.current || !window.google?.maps?.importLibrary) return;
      const { Map3DElement, Polyline3DElement } = await window.google.maps.importLibrary('maps3d');
      if (cancelled) return;
      const map = new Map3DElement({ center: WORLD_CENTER, range: 60000000, tilt: 0, heading: 0, mode: 'SATELLITE', defaultUIHidden: false, style: 'width:100%;height:100%;' });
      map.setAttribute('aria-label', 'Google 3D Earth globe');
      host.current.replaceChildren(map);
      mapRef.current = map;
      if (path.length > 1) {
        const line = new Polyline3DElement({ path, strokeColor: '#00e5ff', outerColor: '#042f49', strokeWidth: 8, outerWidth: 0.45, altitudeMode: 'RELATIVE_TO_GROUND', drawsOccludedSegments: true, geodesic: true });
        map.append(line);
      }
    }).catch(() => { if (!cancelled) { setError('Google 3D Earth could not load. Using the local route map.'); onFallback?.(); } });
    return () => { cancelled = true; mapRef.current = null; };
  }, [onFallback]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (mode === 'globe') { map.center = WORLD_CENTER; map.range = 60000000; map.tilt = 0; return; }
    if (path.length > 1) {
      const mid = path[Math.floor(path.length / 2)];
      map.center = { ...mid, altitude: 0 };
      map.range = 500000;
      map.tilt = 55;
    }
  }, [mode, path]);

  return <div className="relative w-full h-full min-h-[240px] bg-[#061b2b]">
    <div ref={host} className="absolute inset-0" />
    <div className="absolute top-3 left-3 z-[1000] flex gap-2 rounded bg-slate-950/90 p-2 text-xs text-cyan-100 shadow-lg">
      <button className={`px-2 py-1 rounded ${mode === 'globe' ? 'bg-cyan-700' : 'bg-slate-800'}`} onClick={() => setMode('globe')}>3D Earth</button>
      <button className={`px-2 py-1 rounded ${mode === 'route' ? 'bg-cyan-700' : 'bg-slate-800'}`} onClick={() => setMode('route')} disabled={path.length < 2}>Zoom to route</button>
    </div>
    <div className="absolute bottom-2 left-2 z-[1000] rounded bg-slate-950/85 p-2 text-xs text-slate-200">{error || `Google 3D Earth · ${activeRouteType} calculated route`}</div>
  </div>;
}

export { API_KEY };
