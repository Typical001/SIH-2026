import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Circle,
  Marker,
  Popup,
  Tooltip,
  useMap
} from 'react-leaflet';
import L from 'leaflet';

// Custom Map Marker Icons using SVGs
const createCustomIcon = (color, label, pulse = false) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div class="relative flex items-center justify-center">
        ${pulse ? `<span class="absolute w-8 h-8 rounded-full ${color === 'red' ? 'bg-red-500/40' : color === 'green' ? 'bg-emerald-500/40' : 'bg-cyan-500/40'} radar-ping"></span>` : ''}
        <div class="w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] shadow-lg border ${color === 'red'
        ? 'bg-red-600/90 border-red-300 text-white shadow-red-500/50'
        : color === 'green'
          ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-emerald-500/50'
          : color === 'amber'
            ? 'bg-amber-600/90 border-amber-300 text-white shadow-amber-500/50'
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
  origin = { lat: -33.9249, lon: 18.4241 },
  destination = { lat: -69.4125, lon: 76.1872 },
  routeMetrics = null,
  forecastHours = 72
}) {
  const defaultCenter = [-52.0, 48.0];

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
        {/* Esri World Ocean Base — free, no API key required */}
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={13}
        />

        <MapAutoFitter waypoints={waypoints} />

        {/* Sea Ice Concentration Visualization (Marginal & Pack Ice Zones) */}
        {layers.showSeaIce && (
          <>
            {/* Antarctic Coastal Pack Ice Zone (>75% SIC) */}
            <Circle
              center={[-68.5, 45.0]}
              radius={750000}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#bae6fd',
                fillOpacity: 0.18,
                weight: 1.5,
                dashArray: '4, 8'
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono">
                  <strong className="text-cyan-300">Illustrative Antarctic Ice Zone</strong><br />
                  Schematic overlay; not a measured SIC grid.
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
                fillOpacity: 0.22,
                weight: 1.2
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-mono">
                  <strong className="text-cyan-300">Illustrative Prydz Bay Ice Zone</strong><br />
                  Schematic overlay; not a measured SIC grid.
                </div>
              </Tooltip>
            </Circle>
          </>
        )}

        {/* Metocean Grid Currents & Winds */}
        {layers.showMetoceanGrid && metoceanGrid.map((pt, idx) => (
          <Circle
            key={`met-${idx}`}
            center={[pt.lat, pt.lon]}
            radius={25000}
            pathOptions={{
              color: pt.ocean_spd_kts > 0.4 ? '#06b6d4' : '#64748b',
              fillColor: '#0ea5e9',
              fillOpacity: 0.35,
              weight: 0.5
            }}
          >
            <Tooltip>
              <div className="text-[11px] font-mono">
                <div>ACC Current: <strong>{pt.ocean_spd_kts} kts</strong></div>
                <div>Simulated Wind: <strong>{pt.wind_spd_kts} kts</strong></div>
                <div>Sea Ice: <strong>{(pt.sic * 100).toFixed(0)}%</strong></div>
              </div>
            </Tooltip>
          </Circle>
        ))}

        {/* Iceberg Present Positions (0h) */}
        {layers.showPresentBergs && icebergsPresent.map((ib) => (
          <Marker
            key={`present-${ib.id}`}
            position={[ib.lat, ib.lon]}
            icon={icebergPresentIcon}
          >
            <Popup>
              <div className="p-2 space-y-1 font-mono text-xs">
                <div className="font-bold text-cyan-300 flex items-center gap-1">
                  <span>{ib.name}</span>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">0h INITIAL</span>
                </div>
                <div className="text-slate-300">Class: <strong>{ib.ice_class}</strong></div>
                <div className="text-slate-300">Dimensions: <strong>{ib.length_km} × {ib.width_km} km</strong></div>
                <div className="text-slate-300">Mass: <strong>{ib.mass_mt} Mt</strong></div>
                <div className="text-slate-400 text-[10px]">Simulated iceberg catalog</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Iceberg 72h Predicted Positions & 25km Safety Hazard Buffers */}
        {icebergsPredicted.map((ib) => {
          const radiusMeters = (ib.planning_hazard_radius_km ?? ib.safety_radius_km ?? 25.0) * 1000.0;
          const trajectory = Array.isArray(ib.trajectory_points) ? ib.trajectory_points
            .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon))
            .map(p => [p.lat, p.lon]) : [];
          return (
            <React.Fragment key={`pred-frag-${ib.id}`}>
              {/* Drift Trajectory Trail (Dashed Red Line) */}
              {layers.showDriftVectors && trajectory.length > 1 && (
                <Polyline
                  positions={trajectory}
                  pathOptions={{
                    color: '#f87171',
                    weight: 2,
                    dashArray: '5, 6',
                    opacity: 0.8
                  }}
                />
              )}

              {/* 25km+ Safety Hazard Buffer Circle (Impassable Zone) */}
              {layers.showHazardBuffers && (
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
                      Planning envelope radius: <strong>{(radiusMeters / 1000).toFixed(1)} km</strong><br />
                      <span className="text-red-300 font-bold">Simulated forecast hazard area (+{forecastHours}h)</span>
                    </div>
                  </Tooltip>
                </Circle>
              )}

              {/* 72h Predicted Iceberg Center Marker */}
              {layers.showPredictedBergs && <Marker
                position={[ib.lat, ib.lon]}
                icon={icebergIcon}
              >
                <Popup>
                  <div className="p-2 space-y-1.5 font-mono text-xs">
                    <div className="font-bold text-red-400 flex items-center justify-between gap-2 border-b border-red-500/30 pb-1">
                      <span>{ib.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 border border-red-500/40 text-red-300 font-bold">
                        +{forecastHours}h PREDICTED
                      </span>
                    </div>
                    <div className="text-slate-200">
                      Coordinates: <strong>{ib.lat.toFixed(3)}°, {ib.lon.toFixed(3)}°</strong>
                    </div>
                    <div className="text-slate-200">
                      {forecastHours}h Drift Distance: <strong className="text-amber-400">{ib.drift_distance_total_km} km</strong>
                    </div>
                    <div className="text-slate-200">
                      Safety Hazard Radius: <strong className="text-red-400">{ib.safety_radius_km} km</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700">
                      Simulated wind and ocean-current drift model
                    </div>
                  </div>
                </Popup>
              </Marker>}
            </React.Fragment>
          );
        })}

        {/* Benchmark Direct Route (Dashed Amber) */}
        {layers.showDirectRoute && directWaypoints.length > 0 && (
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
                <strong className="text-amber-400">Direct Baseline (Unoptimized)</strong><br />
                <span>Reported hazard intersections: {routeMetrics?.direct_route_collision_hazards?.length ?? 'Unavailable'}</span>
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* A* Dynamic Green Navigation Route */}
        {layers.showAStarRoute && waypoints.length > 0 && (
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
                    <span>A* COMPUTED ROUTE — SIMULATION</span>
                  </div>
                  <div>Distance: <strong className="text-white">{routeMetrics?.distance_nautical_miles ?? '—'} NM</strong></div>
                  <div>ETA: <strong className="text-white">{routeMetrics?.estimated_voyage_days ?? '—'} Days</strong></div>
                  <div>Modeled Fuel Savings: <strong className="text-emerald-300">{routeMetrics?.fuel_savings_percent ?? '—'}%</strong></div>
                  <div>Route clearance has not been verified.</div>
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* Origin Port Marker */}
        {origin && (
          <Marker position={[origin.lat, origin.lon]} icon={portIcon}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <div className="font-bold text-cyan-400">DEPARTURE PORT</div>
                <div>{origin.name || 'Selected departure'} ({origin.lat.toFixed(2)}°, {origin.lon.toFixed(2)}°)</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Antarctic Research Base Marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lon]} icon={stationIcon}>
            <Popup>
              <div className="p-1 font-mono text-xs">
                <div className="font-bold text-emerald-400">DESTINATION STATION</div>
                <div>{destination.name || 'Selected destination'} ({destination.lat.toFixed(2)}°, {destination.lon.toFixed(2)}°)</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Interactive Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel-glow p-3.5 rounded-xl text-xs font-mono space-y-2 max-w-[280px] pointer-events-auto select-none">
        <div className="font-bold text-slate-200 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-cyan-500/30 pb-1.5">
          <span className="text-cyan-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            MAP LAYERS & SYMBOLS
          </span>
          <span className="text-[10px] text-slate-400 font-normal">EPSG:3857</span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-1 rounded bg-emerald-400 shadow-neon-green" />
            <span className="text-emerald-300 font-semibold">A* Computed Route</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-1 border-t-2 border-dashed border-amber-400" />
            <span className="text-amber-300">Direct Baseline</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600/90 border border-red-400 flex items-center justify-center text-[8px] text-white">▲</div>
            <span className="text-red-300 font-medium">{forecastHours}h Predicted Iceberg</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-dashed border-red-500 bg-red-500/25" />
            <span className="text-red-400">Forecast Hazard Buffer</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-full bg-cyan-600/80 border border-cyan-400 flex items-center justify-center text-[8px] text-white">◆</div>
            <span className="text-cyan-300">0h Simulated Iceberg</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-sky-500/25 border border-sky-400/50" />
            <span className="text-sky-300">Illustrative Ice Zones</span>
          </div>
        </div>
      </div>
    </div>
  );
}
