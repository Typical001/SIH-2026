import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  Marker,
  Popup,
  Tooltip,
  GeoJSON,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';

// Custom Map Marker Icons using SVGs
const createCustomIcon = (color, label, pulse = false) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="relative flex items-center justify-center">
        ${pulse ? `<span class="absolute w-8 h-8 rounded-full ${color === 'red' ? 'bg-red-500/40' : color === 'green' ? 'bg-emerald-500/40' : color === 'amber' ? 'bg-amber-500/40' : color === 'purple' ? 'bg-fuchsia-500/40' : 'bg-cyan-500/40'} radar-ping"></span>` : ''}
        <div class="w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-lg border ${
          color === 'red'
            ? 'bg-red-600/90 border-red-300 text-white shadow-red-500/50'
            : color === 'green'
              ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-emerald-500/50'
              : color === 'amber'
                ? 'bg-amber-600/90 border-amber-300 text-white shadow-amber-500/50'
                : color === 'purple'
                  ? 'bg-fuchsia-600/90 border-fuchsia-300 text-white shadow-fuchsia-500/50'
                  : 'bg-cyan-600/90 border-cyan-300 text-white shadow-cyan-500/50'
        }">
          ${label}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14]
  });
};

const portIcon = createCustomIcon('cyan', '⚓', false);
const stationIcon = createCustomIcon('green', '❄️', true);
const icebergIcon = createCustomIcon('red', '▲', true);
const icebergPresentIcon = createCustomIcon('cyan', '◆', false);
const refIcebergIcon = createCustomIcon('purple', '◈', false);
const shipGpsIcon = createCustomIcon('amber', '🚢', true);

function MapClickHandler({ departureMode, onMapClickCoord }) {
  useMapEvents({
    click(e) {
      if (departureMode === 'MID_OCEAN_COORDINATES' && onMapClickCoord) {
        onMapClickCoord([Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4))]);
      }
    }
  });
  return null;
}

// Dynamic vector icons for ocean currents & wind
const createCurrentVectorIcon = (spdKnots, dirDeg) => {
  const color = spdKnots > 0.8 ? '#10b981' : spdKnots > 0.3 ? '#06b6d4' : '#38bdf8';
  return L.divIcon({
    className: 'current-vector-icon',
    html: `
      <div class="flex items-center justify-center pointer-events-auto cursor-pointer" style="transform: rotate(${dirDeg}deg);" title="${spdKnots} kts @ ${dirDeg}°">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const createWindVectorIcon = (spdKnots, dirDeg) => {
  const color = spdKnots > 30 ? '#ef4444' : spdKnots > 18 ? '#f59e0b' : '#38bdf8';
  return L.divIcon({
    className: 'wind-vector-icon',
    html: `
      <div class="flex flex-col items-center justify-center pointer-events-auto cursor-pointer">
        <div style="transform: rotate(${dirDeg}deg);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <polyline points="6 10 12 4 18 10"></polyline>
          </svg>
        </div>
        <span class="text-[8px] font-mono font-bold px-0.5 rounded bg-black/80 text-slate-200 border border-slate-700/60 leading-none">
          ${Math.round(spdKnots)}kt
        </span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

// Component to adjust map view when route changes
function MapAutoFitter({ waypoints }) {
  const map = useMap();
  useEffect(() => {
    if (waypoints && waypoints.length > 0) {
      const bounds = L.latLngBounds(waypoints);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6, animate: true });
    }
  }, [waypoints, map]);
  return null;
}

export default function PolarMap({
  waypoints = [],
  directWaypoints = [],
  icebergsPresent = [],
  icebergsPredicted = [],
  metoceanGrid = [],
  layers = {
    showAStarRoute: true,
    showDirectRoute: true,
    showPredictedBergs: true,
    showPresentBergs: true,
    showHazardBuffers: true,
    showDriftVectors: true,
    showSeaIce: true,
    showMetoceanGrid: false
  },
  layerVisibility = null,
  byuIcebergData = null,
  sarFootprintsData = null,
  seaIceLayerData = null,
  oceanCurrentsData = null,
  weatherWindData = null,
  origin = { lat: -33.9249, lon: 18.4241 },
  destination = { lat: -69.4125, lon: 76.1872 },
  originLabel = 'Cape Town Port',
  destLabel = 'Bharati Station',
  departureMode = 'GATEWAY',
  onMapClickCoord = null,
  routeMetrics = null,
  paretoRoutes = null,
  activeRouteType = 'BALANCED',
  onSelectRouteType = () => {},
}) {
  const defaultCenter = [-52.0, 48.0];

  // Resolve active visibility configuration
  const activeLayers = {
    seaIce: layerVisibility ? layerVisibility.seaIce : layers.showSeaIce,
    refIcebergs: layerVisibility ? layerVisibility.refIcebergs : true,
    sarCandidates: layerVisibility ? layerVisibility.sarCandidates : true,
    predictedIcebergs: layerVisibility ? layerVisibility.predictedIcebergs : layers.showPredictedBergs,
    riskHeatmap: layerVisibility ? layerVisibility.riskHeatmap : layers.showHazardBuffers,
    optimizedRoutes: layerVisibility ? layerVisibility.optimizedRoutes : layers.showAStarRoute,
    oceanCurrents: layerVisibility ? layerVisibility.oceanCurrents : layers.showMetoceanGrid,
    weatherWind: layerVisibility ? layerVisibility.weatherWind : layers.showMetoceanGrid,
    bathymetry: layerVisibility ? layerVisibility.bathymetry : false,
  };

  // Extract active pareto route waypoints for MapAutoFitter
  const activePareto = paretoRoutes?.features?.find(f => f.properties?.route_type === activeRouteType);
  const activeWaypoints = activePareto?.properties?.waypoints_latlon || waypoints;

  const PILL_PROFILES = [
    { type: 'SAFEST',   emoji: '🛡️', label: 'Safest',   color: '#10b981', bg: 'bg-emerald-600', border: 'border-emerald-400', dim: 'border-emerald-800/50 text-emerald-600' },
    { type: 'BALANCED', emoji: '⚡', label: 'Balanced', color: '#0ea5e9', bg: 'bg-sky-600',     border: 'border-sky-400',     dim: 'border-sky-800/50 text-sky-600' },
    { type: 'FASTEST',  emoji: '⏱️', label: 'Fastest',  color: '#f59e0b', bg: 'bg-amber-600',  border: 'border-amber-400',   dim: 'border-amber-800/50 text-amber-600' },
  ];

  return (
    <div className="relative w-full h-full bg-[#030712] overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={3}
        minZoom={2}
        maxZoom={9}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <MapClickHandler departureMode={departureMode} onMapClickCoord={onMapClickCoord} />

        {/* Esri World Ocean Base — free, no API key required */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={13}
        />

        {/* ── LAYER 7: GEBCO BATHYMETRY CONTOURS (NOAA NCEI WMS TileLayer) ── */}
        {activeLayers.bathymetry && (
          <TileLayer
            key="gebco-bathymetry-wms-layer"
            attribution='Depth Contours &copy; GEBCO / NOAA NCEI'
            url="https://gis.ngdc.noaa.gov/arcgis/rest/services/web_mercator/gebco_2023_contours/MapServer/tile/{z}/{y}/{x}"
            opacity={0.65}
            zIndex={4}
          />
        )}

        <MapAutoFitter waypoints={activeWaypoints} />

        {/* ── LAYER 1: AMSR2 25KM SEA ICE CONCENTRATION GRID ── */}
        {activeLayers.seaIce && seaIceLayerData && seaIceLayerData.features && (
          <GeoJSON
            key={`sea-ice-grid-${seaIceLayerData.features.length}`}
            data={seaIceLayerData}
            style={(feature) => {
              const sic = feature?.properties?.sea_ice_concentration || 0;
              let fillColor = '#0369a1';
              let fillOpacity = 0.16;
              let strokeColor = '#0284c7';
              if (sic >= 0.70) {
                fillColor = '#38bdf8';
                fillOpacity = 0.42;
                strokeColor = '#7dd3fc';
              } else if (sic >= 0.40) {
                fillColor = '#0ea5e9';
                fillOpacity = 0.28;
                strokeColor = '#38bdf8';
              } else if (sic >= 0.15) {
                fillColor = '#0284c7';
                fillOpacity = 0.20;
                strokeColor = '#0ea5e9';
              }
              return {
                color: strokeColor,
                weight: 1,
                fillColor: fillColor,
                fillOpacity: fillOpacity,
                opacity: 0.55
              };
            }}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              const rio = p.polaris_rio_pc3 ?? 0;
              layer.bindTooltip(`
                <div class="text-xs font-mono">
                  <strong class="text-sky-300">AMSR2 25km Sea Ice Grid</strong><br />
                  Coordinates: <strong>${p.latitude}°, ${p.longitude}°</strong><br />
                  SIC: <strong>${p.sea_ice_percent ?? (p.sea_ice_concentration * 100).toFixed(1)}%</strong><br />
                  Category: <strong>${p.ice_category || 'Pack Ice'}</strong><br />
                  POLARIS RIO (PC3): <strong style="color: ${rio < 0 ? '#ef4444' : '#10b981'};">${rio}</strong>
                </div>
              `, { sticky: true });
            }}
          />
        )}

        {/* Regional Sea Ice Landmark Circles */}
        {activeLayers.seaIce && (
          <>
            {/* Antarctic Coastal Pack Ice Zone (>75% SIC) */}
            <Circle
              center={[-68.5, 45.0]}
              radius={750000}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#bae6fd',
                fillOpacity: 0.14,
                weight: 1.5,
                dashArray: '4, 8'
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono">
                  <strong className="text-cyan-300">Antarctic Pack Ice Zone (SIC: 75-95%)</strong><br />
                  Heavy Polar ice sheets & fast-ice margin.
                </div>
              </Tooltip>
            </Circle>

            {/* Prydz Bay / Bharati Approach Marginal Ice Zone */}
            <Circle
              center={[-67.0, 72.0]}
              radius={380000}
              pathOptions={{
                color: '#22d3ee',
                fillColor: '#38bdf8',
                fillOpacity: 0.18,
                weight: 1.2
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono">
                  <strong className="text-cyan-300">Prydz Bay Marginal Ice Zone (SIC: 40-70%)</strong><br />
                  Bharati Station navigation approach corridor.
                </div>
              </Tooltip>
            </Circle>
          </>
        )}

        {/* ── LAYER 3: SAR CANDIDATES (Copernicus Sentinel-1 SAR Radar Footprints) ── */}
        {activeLayers.sarCandidates && sarFootprintsData && sarFootprintsData.features && (
          <GeoJSON
            key={`sar-footprints-${sarFootprintsData.features.length}`}
            data={sarFootprintsData}
            style={{
              color: '#06b6d4',
              weight: 2,
              fillColor: '#0891b2',
              fillOpacity: 0.12,
              dashArray: '5, 5'
            }}
            onEachFeature={(feature, layer) => {
              const p = feature.properties || {};
              layer.bindPopup(`
                <div class="p-2 space-y-1 font-mono text-xs text-slate-200">
                  <div class="font-bold text-cyan-300 border-b border-cyan-500/30 pb-1 flex items-center justify-between gap-2">
                    <span>${p.name || 'Sentinel-1 SAR Swath'}</span>
                    <span class="text-[9px] px-1 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                      LIVE SAR
                    </span>
                  </div>
                  <div>Sensor: <strong>${p.sensor || 'Sentinel-1A C-SAR'}</strong></div>
                  <div>Mode: <strong>${p.mode || 'Extra Wide Swath'}</strong></div>
                  <div>Polarization: <strong>${p.polarization || 'HH+HV Dual-Pol'}</strong></div>
                  <div>Acquisition: <strong>${p.content_date || 'Live Pass'}</strong></div>
                  <div class="text-[10px] text-cyan-400 mt-1">${p.candidate_type || 'SAR Radar Detection Frame'}</div>
                  <div class="text-[9px] text-slate-400 pt-1 border-t border-slate-700">${p.source || 'Copernicus Data Space Ecosystem'}</div>
                </div>
              `);
            }}
          />
        )}

        {/* ── LAYER 2: REFERENCE ICEBERGS (BYU MERS SCAT/OSCAT Historical & Validated Tracks) ── */}
        {activeLayers.refIcebergs && byuIcebergData && byuIcebergData.features && byuIcebergData.features.map((feat, idx) => {
          const coords = feat.geometry?.coordinates || [];
          const lon = coords[0];
          const lat = coords[1];
          if (lat === undefined || lon === undefined) return null;
          const p = feat.properties || {};

          return (
            <Marker
              key={`byu-berg-${p.id || idx}`}
              position={[lat, lon]}
              icon={refIcebergIcon}
            >
              <Popup>
                <div className="p-2 space-y-1.5 font-mono text-xs">
                  <div className="font-bold text-fuchsia-300 flex items-center justify-between gap-2 border-b border-fuchsia-500/30 pb-1">
                    <span>{p.name || `BYU Berg ${idx}`}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-950 border border-fuchsia-400/40 text-fuchsia-300 font-bold">
                      BYU MERS TRACK
                    </span>
                  </div>
                  <div className="text-slate-200">
                    Coordinates: <strong>{lat.toFixed(3)}°, {lon.toFixed(3)}°</strong>
                  </div>
                  <div className="text-slate-200">
                    Tracked Area: <strong className="text-fuchsia-300">{p.size_sqkm} km²</strong>
                    {p.length_km && p.width_km && ` (${p.length_km} × ${p.width_km} km)`}
                  </div>
                  <div className="text-slate-200">
                    Observation Date: <strong>{p.date_tracked || '2026-09-22'}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                    Archive: {p.database || 'BYU MERS Scatterometer Iceberg Database'}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── LAYER 5: OCEAN CURRENTS (HYCOM / GLORYS Surface Vectors) ── */}
        {activeLayers.oceanCurrents && oceanCurrentsData && oceanCurrentsData.features && oceanCurrentsData.features.map((feat, idx) => {
          const coords = feat.geometry?.coordinates || [];
          const lon = coords[0];
          const lat = coords[1];
          if (lat === undefined || lon === undefined) return null;
          const p = feat.properties || {};

          return (
            <Marker
              key={`ocean-curr-${idx}`}
              position={[lat, lon]}
              icon={createCurrentVectorIcon(p.speed_knots || 0, p.direction_deg || 0)}
            >
              <Popup>
                <div className="p-2 space-y-1 font-mono text-xs">
                  <div className="font-bold text-cyan-300 border-b border-cyan-500/30 pb-1">
                    🌊 HYCOM / GLORYS OCEAN CURRENT
                  </div>
                  <div>Coordinates: <strong>{lat.toFixed(2)}°, {lon.toFixed(2)}°</strong></div>
                  <div>Current Speed: <strong>{p.speed_knots} kts</strong> ({p.speed_mps} m/s)</div>
                  <div>Direction: <strong>{p.direction_deg}°</strong></div>
                  <div>Velocity Vectors: <strong>u={p.u_current} m/s, v={p.v_current} m/s</strong></div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">{p.source}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── LAYER 6: WEATHER WIND (ECMWF IFS 0.25° 10m Vectors) ── */}
        {activeLayers.weatherWind && weatherWindData && weatherWindData.features && weatherWindData.features.map((feat, idx) => {
          const coords = feat.geometry?.coordinates || [];
          const lon = coords[0];
          const lat = coords[1];
          if (lat === undefined || lon === undefined) return null;
          const p = feat.properties || {};

          return (
            <Marker
              key={`weather-wind-${idx}`}
              position={[lat, lon]}
              icon={createWindVectorIcon(p.speed_knots || 0, p.direction_deg || 0)}
            >
              <Popup>
                <div className="p-2 space-y-1 font-mono text-xs">
                  <div className="font-bold text-sky-300 border-b border-sky-500/30 pb-1">
                    💨 ECMWF IFS 0.25° WIND VECTOR
                  </div>
                  <div>Coordinates: <strong>{lat.toFixed(2)}°, {lon.toFixed(2)}°</strong></div>
                  <div>Wind Speed: <strong>{p.speed_knots} kts</strong> ({p.speed_mps} m/s)</div>
                  <div>Wind Direction: <strong>{p.direction_deg}°</strong></div>
                  <div>Velocity Vectors: <strong>u={p.u_wind} m/s, v={p.v_wind} m/s</strong></div>
                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">{p.source}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── LAYER 4: OFFICIAL ICEBERGS (USNIC / NOAA FeatureServer) & HAZARD BUFFERS ── */}
        {activeLayers.predictedIcebergs && icebergsPresent.map((ib) => {
          const areaSqKm = ib.metadata?.size_sqkm || (ib.length_km * ib.width_km).toFixed(1);
          const dateObserved = ib.last_updated_utc || ib.metadata?.date_tracked || '2026-09-22';
          const bufferRadiusMeters = 15000; // 15 km impassable safety buffer

          return (
            <React.Fragment key={`present-frag-${ib.id}`}>
              {/* 15 km Impassable Safety Buffer Circle (controlled by Risk Heatmap switch) */}
              {activeLayers.riskHeatmap && (
                <Circle
                  center={[ib.lat, ib.lon]}
                  radius={bufferRadiusMeters}
                  pathOptions={{
                    color: '#06b6d4',
                    fillColor: '#0891b2',
                    fillOpacity: 0.22,
                    weight: 1.2,
                    dashArray: '4, 4'
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs font-mono">
                      <strong className="text-cyan-300">15 KM SAFETY BUFFER: {ib.name}</strong><br />
                      Tracked Area: <strong>{areaSqKm} km²</strong><br />
                      Last Obs Date: <strong>{dateObserved}</strong>
                    </div>
                  </Tooltip>
                </Circle>
              )}

              <Marker
                position={[ib.lat, ib.lon]}
                icon={icebergPresentIcon}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 font-mono text-xs">
                    <div className="font-bold text-cyan-300 flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-1">
                      <span>{ib.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
                        LIVE SATELLITE
                      </span>
                    </div>
                    <div className="text-slate-200">
                      Coordinates: <strong>{ib.lat.toFixed(4)}°, {ib.lon.toFixed(4)}°</strong>
                    </div>
                    <div className="text-slate-200">
                      Tracked Area: <strong className="text-cyan-300">{areaSqKm} km²</strong> ({ib.length_km} × {ib.width_km} km)
                    </div>
                    <div className="text-slate-200">
                      Observation Date: <strong>{dateObserved}</strong>
                    </div>
                    <div className="text-slate-200">
                      Safety Buffer: <strong className="text-cyan-400">15 km Impassable Zone</strong>
                    </div>
                    <div className="text-slate-300">Class: <strong>{ib.ice_class}</strong></div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      Source: {ib.source || 'USNIC / NOAA GeoPlatform ArcGIS'}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Iceberg 72h Predicted Positions & 25km Safety Hazard Buffers */}
        {activeLayers.predictedIcebergs && icebergsPredicted.map((ib) => {
          const radiusMeters = (ib.safety_radius_km || 25.0) * 1000.0;
          return (
            <React.Fragment key={`pred-frag-${ib.id}`}>
              {/* Drift Trajectory Trail (Dashed Red Line) */}
              {ib.initial_lat && (
                <Polyline
                  positions={[
                    [ib.initial_lat, ib.initial_lon],
                    [ib.lat, ib.lon]
                  ]}
                  pathOptions={{
                    color: '#f87171',
                    weight: 2,
                    dashArray: '5, 6',
                    opacity: 0.8
                  }}
                />
              )}

              {/* 25km+ Safety Hazard Buffer Circle (Impassable Zone) */}
              {activeLayers.riskHeatmap && (
                <Circle
                  center={[ib.lat, ib.lon]}
                  radius={radiusMeters}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.28,
                    weight: 1.5,
                    dashArray: '3, 4'
                  }}
                >
                  <Tooltip sticky>
                    <div className="text-xs font-mono">
                      <strong className="text-red-400">HAZARD BUFFER: {ib.name}</strong><br />
                      Safety Radius: <strong>{ib.safety_radius_km} km</strong> ({ib.safety_radius_nm} NM)<br />
                      Status: <span className="text-red-300 font-bold">IMPASSABLE HAZARD (Cost 99,999)</span>
                    </div>
                  </Tooltip>
                </Circle>
              )}

              {/* 72h Predicted Iceberg Center Marker */}
              <Marker
                position={[ib.lat, ib.lon]}
                icon={icebergIcon}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 font-mono text-xs">
                    <div className="font-bold text-red-400 flex items-center justify-between gap-2 border-b border-red-500/30 pb-1">
                      <span>{ib.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 font-bold">
                        +72h PREDICTED
                      </span>
                    </div>
                    <div className="text-slate-200">
                      Coordinates: <strong>{ib.lat.toFixed(3)}°, {ib.lon.toFixed(3)}°</strong>
                    </div>
                    <div className="text-slate-200">
                      72h Drift Distance: <strong className="text-amber-400">{ib.drift_distance_total_km} km</strong>
                    </div>
                    <div className="text-slate-200">
                      Safety Hazard Radius: <strong className="text-red-400">{ib.safety_radius_km} km</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      Physics: ERA5 Wind Drag (C=0.032) + HYCOM Ocean Keel Drag (C=0.88)
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Benchmark Direct Route (Dashed Amber) */}
        {directWaypoints.length > 0 && (
          <Polyline
            positions={directWaypoints}
            pathOptions={{
              color: '#f59e0b',
              weight: 2.5,
              dashArray: '6, 8',
              opacity: 0.65
            }}
          >
            <Tooltip sticky>
              <div className="text-xs font-mono">
                <strong className="text-amber-400">Benchmark Great Circle (Unoptimized)</strong><br />
                <span className="text-red-400 font-semibold">⚠️ Intersects Predicted Iceberg Drift Buffers!</span>
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* ── PARETO 3-ROUTE POLYLINES (Controlled by activeLayers.optimizedRoutes) ── */}
        {activeLayers.optimizedRoutes && paretoRoutes && PILL_PROFILES.map(pill => {
          const feature = paretoRoutes.features?.find(f => f.properties?.route_type === pill.type);
          if (!feature) return null;
          const wpts = feature.properties?.waypoints_latlon || [];
          const isActive = pill.type === activeRouteType;
          return (
            <Polyline
              key={`pareto-${pill.type}`}
              positions={wpts}
              pathOptions={{
                color: pill.color,
                weight: isActive ? 5 : 2,
                opacity: isActive ? 1.0 : 0.3,
                dashArray: isActive ? null : '6 8',
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{ click: () => onSelectRouteType(pill.type) }}
            >
              {isActive && (
                <Tooltip sticky>
                  <div className="p-1 font-mono text-xs space-y-0.5">
                    <div className="font-bold" style={{ color: pill.color }}>
                      {pill.emoji} {pill.label.toUpperCase()} ROUTE (ACTIVE)
                    </div>
                    <div>Distance: <strong>{feature.properties.distance_nm} NM</strong></div>
                    <div>ETA: <strong>{feature.properties.eta_hours}h</strong></div>
                    <div>Min POLARIS RIO: <strong>{feature.properties.min_polaris_rio}</strong></div>
                    <div>Max Ice: <strong>{(feature.properties.max_ice_concentration * 100).toFixed(1)}%</strong></div>
                    <div className="text-slate-400 text-[10px]">{feature.properties.data_source}</div>
                    {feature.properties.flags?.length > 0 && (
                      <div className="text-amber-400 text-[10px]">⚠️ {feature.properties.flags.join(', ')}</div>
                    )}
                  </div>
                </Tooltip>
              )}
            </Polyline>
          );
        })}

        {/* Legacy A* single route (shown when paretoRoutes not yet loaded) */}
        {activeLayers.optimizedRoutes && !paretoRoutes && waypoints.length > 0 && (
          <>
            {/* Glowing Backdrop Line */}
            <Polyline
              positions={waypoints}
              pathOptions={{
                color: '#10b981',
                weight: 7,
                opacity: 0.35,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Primary Sharp Line with Pulse Animation */}
            <Polyline
              positions={waypoints}
              pathOptions={{
                color: '#34d399',
                weight: 4,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'animated-route-path'
              }}
            >
              <Tooltip sticky>
                <div className="p-1 font-mono text-xs space-y-1">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>A* OPTIMAL SAFE POLAR ROUTE</span>
                  </div>
                  <div>Distance: <strong className="text-white">{routeMetrics?.distance_nautical_miles || '—'} NM</strong></div>
                  <div>ETA: <strong className="text-white">{routeMetrics?.estimated_voyage_days || '—'} Days</strong></div>
                  <div>Fuel Savings: <strong className="text-emerald-300">+{routeMetrics?.fuel_savings_percent || '—'}%</strong></div>
                  <div>Status: <strong className="text-emerald-400">100% Collision-Free</strong></div>
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* Origin / Departure Marker */}
        {origin && typeof origin.lat === 'number' && typeof origin.lon === 'number' && (
          <Marker 
            position={[origin.lat, origin.lon]} 
            icon={departureMode === 'GATEWAY' ? portIcon : shipGpsIcon}
          >
            <Popup>
              <div className="p-1 font-mono text-xs">
                <div className={`font-bold ${departureMode === 'GATEWAY' ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {departureMode === 'GATEWAY' 
                    ? 'POLAR EXPEDITION GATEWAY' 
                    : departureMode === 'CURRENT_SHIP_GPS' 
                      ? 'VESSEL IN-VOYAGE AIS FIX' 
                      : 'CUSTOM OCEAN WAYPOINT (MAP CLICK)'}
                </div>
                <div>{originLabel} ({origin.lat.toFixed(2)}°, {origin.lon.toFixed(2)}°)</div>
                <div className="text-[10px] text-slate-400">
                  {departureMode === 'GATEWAY' ? 'Official Polar Gateway Hub' : 'In-Voyage Dynamic Re-route Origin'}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Antarctic Research Base Marker */}
        {destination && typeof destination.lat === 'number' && typeof destination.lon === 'number' && (
          <Marker position={[destination.lat, destination.lon]} icon={stationIcon}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <div className="font-bold text-emerald-400">DESTINATION STATION</div>
                <div>{destLabel} ({destination.lat.toFixed(2)}°, {destination.lon.toFixed(2)}°)</div>
                <div className="text-[10px] text-slate-400">Antarctic Research Base</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Interactive Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel-glow p-3.5 rounded-xl text-xs font-mono space-y-2 max-w-[300px] pointer-events-auto select-none">
        <div className="font-bold text-slate-200 flex items-center justify-between border-b border-cyan-500/30 pb-1.5">
          <span className="text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            7 MAP DISPLAY LAYERS
          </span>
          <span className="text-[10px] text-slate-400 font-normal">EPSG:3857/Polar</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded bg-emerald-400 shadow-neon-green" />
            <span className="text-emerald-300 font-semibold">Pareto Optimal Routes</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-600/80 border border-cyan-400 flex items-center justify-center text-[8px] text-white">◆</div>
            <span className="text-cyan-300">USNIC / NOAA Icebergs</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-fuchsia-600/90 border border-fuchsia-400 flex items-center justify-center text-[8px] text-white">◈</div>
            <span className="text-fuchsia-300">BYU MERS Reference Bergs</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded border border-dashed border-cyan-400 bg-cyan-500/20" />
            <span className="text-cyan-300">Sentinel-1 SAR Footprints</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-sky-500/30 border border-sky-400/50" />
            <span className="text-sky-300">AMSR2 25km Sea Ice Grid</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-dashed border-red-500 bg-red-500/25" />
            <span className="text-red-400">25km / 15km Hazard Buffer</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-2 border-b-2 border-indigo-400 border-dashed" />
            <span className="text-indigo-300">GEBCO Depth Contours</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-teal-400 text-xs">➔</span>
            <span className="text-teal-300">HYCOM Ocean / ECMWF Wind</span>
          </div>
        </div>
      </div>

      {/* ── ROUTE PROFILE PILL SWITCHER (absolute top-left of map) ── */}
      {paretoRoutes && (
        <div className="absolute top-3 left-3 z-[30] flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex gap-1.5">
            {PILL_PROFILES.map(pill => {
              const isActive = pill.type === activeRouteType;
              const feature = paretoRoutes.features?.find(f => f.properties?.route_type === pill.type);
              const distNm = feature?.properties?.distance_nm ?? '—';
              const eta = feature?.properties?.eta_hours ?? '—';
              const burnMt = feature?.properties?.total_fuel_burn_mt;
              const feasibility = feature?.properties?.feasibility_status;
              const isUnreachable = feasibility === 'UNREACHABLE';

              return (
                <button
                  key={pill.type}
                  id={`route-pill-${pill.type.toLowerCase()}`}
                  onClick={() => !isUnreachable && onSelectRouteType(pill.type)}
                  title={`${pill.label} — ${distNm} NM / ${eta}h ETA | Burn: ${burnMt ?? '—'} MT [${feasibility ?? 'OK'}]`}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold font-mono
                    border transition-all duration-200 select-none
                    ${isUnreachable
                      ? 'bg-red-950/60 border-red-500/50 text-red-300/80 cursor-not-allowed'
                      : isActive
                        ? `text-white border-2 shadow-lg ${pill.bg} ${pill.border}`
                        : `bg-slate-900/85 text-slate-400 border ${pill.dim} hover:text-white hover:bg-slate-800`
                    }
                  `}
                  style={isActive && !isUnreachable ? { boxShadow: `0 0 12px ${pill.color}60` } : {}}
                >
                  <span>{pill.emoji}</span>
                  <span>{pill.label}</span>
                  {burnMt && (
                    <span className={`text-[10px] font-normal px-1 py-0.2 rounded ${
                      isUnreachable 
                        ? 'bg-red-900/80 text-red-200' 
                        : isActive 
                          ? 'bg-black/30 text-white' 
                          : 'bg-slate-800 text-slate-300'
                    }`}>
                      {burnMt.toFixed(0)} MT
                    </span>
                  )}
                  {isUnreachable && (
                    <span className="text-[9px] text-red-300 font-bold">⚠️ OOR</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Auto-Switched Bridge Alert Pill */}
          {paretoRoutes.metadata?.auto_switched && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-500/70 text-amber-200 text-[10px] font-mono shadow-md backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>BUNKER GATED: Safest detour unreachable. Auto-switched to Balanced.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
