import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Ship, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Anchor,
  Navigation,
  Crosshair,
  Compass
} from 'lucide-react';

// ── 5 Official Polar Gateway Hubs ───────────────────────────────────────────
export const POLAR_GATEWAYS = [
  { code: 'ZACPT', name: 'Cape Town Port (South Africa)',        country: 'South Africa', lat: -33.9249, lon: 18.4241, desc: 'Primary MoES/NCPOR Expedition Hub' },
  { code: 'USH',   name: 'Ushuaia Port (Argentina)',             country: 'Argentina',    lat: -54.8019, lon: -68.3030, desc: 'Drake Passage Gateway' },
  { code: 'CLPUQ', name: 'Punta Arenas (Chile)',                 country: 'Chile',        lat: -53.1638, lon: -70.9171, desc: 'Magellan Gateway' },
  { code: 'AUHBT', name: 'Hobart Port (Tasmania, Australia)',    country: 'Australia',    lat: -42.8821, lon: 147.3272, desc: 'East Antarctica Gateway' },
  { code: 'NZLYT', name: 'Christchurch / Lyttelton Port (NZ)',   country: 'New Zealand',  lat: -43.6033, lon: 172.7194, desc: 'Ross Sea Gateway' },
];

// ── Official Antarctic Destination Stations ─────────────────────────────────
export const ANTARCTIC_STATIONS = [
  { id: 'bharati_station', name: 'Bharati Station (India - Prydz Bay)',        lat: -69.4125, lon: 76.1872, sector: 'Larsemann Hills, East Antarctica' },
  { id: 'maitri_station',  name: 'Maitri Station (India - Schirmacher Oasis)', lat: -70.7667, lon: 11.7333, sector: 'Dronning Maud Land' },
  { id: 'mcmurdo_station', name: 'McMurdo Station (USA - Ross Island)',        lat: -77.8460, lon: 166.6680, sector: 'Ross Ice Shelf' },
  { id: 'rothera_station', name: 'Rothera Station (UK - Adelaide Island)',     lat: -67.5683, lon: -68.1275, sector: 'Antarctic Peninsula' },
];

export default function ControlDeck({
  departureMode = 'GATEWAY',
  onChangeDepartureMode,
  selectedGateway = 'ZACPT',
  onChangeGateway,
  selectedStation = 'bharati_station',
  onChangeStation,
  shipCoords = [-64.50, 72.00],
  onAcquireShipGps,
  onManualCoordsChange,
  forecastHours,
  onChangeForecastHours,
  vesselIceClass,
  onChangeVesselIceClass,
  safetyBufferKm,
  onChangeSafetyBufferKm,
  cruisingSpeed,
  onChangeCruisingSpeed,
  onRecalculate,
  loading
}) {
  const [manualLat, setManualLat] = useState(String(shipCoords[0] || -64.50));
  const [manualLon, setManualLon] = useState(String(shipCoords[1] || 72.00));

  useEffect(() => {
    if (shipCoords && shipCoords.length === 2) {
      setManualLat(String(shipCoords[0]));
      setManualLon(String(shipCoords[1]));
    }
  }, [shipCoords]);

  const handleManualSubmit = () => {
    const la = parseFloat(manualLat);
    const lo = parseFloat(manualLon);
    if (!isNaN(la) && !isNaN(lo) && onManualCoordsChange) {
      onManualCoordsChange([la, lo]);
    }
  };

  const iceClasses = [
    { id: 'Polar Class 1 (PC1)', name: 'PC1: Planning ice limit 100%' },
    { id: 'Polar Class 3 (PC3)', name: 'PC3: Planning ice limit 90%' },
    { id: 'Polar Class 5 (PC5)', name: 'PC5: Planning ice limit 75%' },
    { id: 'Polar Class 7 (PC7)', name: 'PC7: Planning ice limit 40%' },
    { id: 'Open Water Vessel',   name: 'Open Water: Planning ice limit 5%' }
  ];

  return (
    <div className="glass-panel border-t border-cyan-500/20 px-5 py-3.5 z-20 shrink-0 select-none max-h-[30vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

        {/* ── Section 1: In-Voyage Departure Mode & Gateway (Cols 5) ── */}
        <div className="md:col-span-5 space-y-2">
          {/* Departure Mode Selector Tabs */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Departure Positioning:
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              {departureMode === 'GATEWAY' ? 'OFFICIAL GATEWAY' : departureMode === 'CURRENT_SHIP_GPS' ? 'SAVED / ASSUMED WAYPOINT' : 'MAP CLICK FIX'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              id="dep-tab-gateway"
              onClick={() => onChangeDepartureMode('GATEWAY')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono font-semibold transition ${
                departureMode === 'GATEWAY'
                  ? 'bg-cyan-600 text-white shadow-neon-cyan'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Anchor className="w-3.5 h-3.5" />
              <span>Polar Gateway</span>
            </button>

            <button
              type="button"
              id="dep-tab-ship-gps"
              onClick={() => {
                onChangeDepartureMode('CURRENT_SHIP_GPS');
                if (onAcquireShipGps) onAcquireShipGps();
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono font-semibold transition ${
                departureMode === 'CURRENT_SHIP_GPS'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Vessel waypoint</span>
            </button>

            <button
              type="button"
              id="dep-tab-map-click"
              onClick={() => onChangeDepartureMode('MID_OCEAN_COORDINATES')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono font-semibold transition ${
                departureMode === 'MID_OCEAN_COORDINATES'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Map Click</span>
            </button>
          </div>

          {/* Conditional Sub-View Based on Departure Mode */}
          {departureMode === 'GATEWAY' && (
            <div className="flex items-center gap-2">
              <Anchor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <select
                id="select-polar-gateway"
                value={selectedGateway}
                onChange={(e) => onChangeGateway(e.target.value)}
                className="flex-1 bg-slate-900/90 border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                {POLAR_GATEWAYS.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.name} [{g.lat}°, {g.lon}°]
                  </option>
                ))}
              </select>
            </div>
          )}

          {departureMode === 'CURRENT_SHIP_GPS' && (
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-amber-500/30 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-300">
                  Fix: <strong className="text-amber-300">{Number(shipCoords[0]).toFixed(3)}°, {Number(shipCoords[1]).toFixed(3)}°</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={onAcquireShipGps}
                className="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-amber-200 text-[10px] hover:bg-amber-900 transition"
              >
                Load saved waypoint
              </button>
            </div>
          )}

          {departureMode === 'MID_OCEAN_COORDINATES' && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 bg-cyan-950/40 p-1 rounded border border-cyan-500/30">
                <Navigation className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
                <span>Click anywhere on Southern Ocean map or enter fix below:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.0001"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  onBlur={handleManualSubmit}
                  placeholder="Lat (e.g. -64.50)"
                  className="w-0 flex-1 bg-slate-900/70 border border-slate-700 focus:border-cyan-500/60 text-slate-300 rounded px-2 py-1 text-[11px] font-mono outline-none"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  onBlur={handleManualSubmit}
                  placeholder="Lon (e.g. 72.00)"
                  className="w-0 flex-1 bg-slate-900/70 border border-slate-700 focus:border-cyan-500/60 text-slate-300 rounded px-2 py-1 text-[11px] font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  className="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-[10px] font-mono"
                >
                  Set
                </button>
              </div>
            </div>
          )}

          {/* Destination Antarctic Research Base */}
          <div className="flex items-center gap-2 pt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-400 uppercase shrink-0">Station:</span>
            <select
              id="select-antarctic-station"
              value={selectedStation}
              onChange={(e) => onChangeStation(e.target.value)}
              className="flex-1 bg-slate-900/90 border border-slate-700 text-emerald-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-emerald-400"
            >
              {ANTARCTIC_STATIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Section 2: Vessel Class & Speeds (Cols 4) ── */}
        <div className="md:col-span-4 space-y-2">
          {/* Vessel Polar Class */}
          <div className="flex items-center gap-2">
            <Ship className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-400 uppercase shrink-0">Vessel Class:</span>
            <select
              value={vesselIceClass}
              onChange={(e) => onChangeVesselIceClass(e.target.value)}
              className="flex-1 bg-slate-900/90 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-400"
            >
              {iceClasses.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Cruising Speed Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" />
                Cruising Speed:
              </span>
              <span className="text-cyan-300 font-bold">{cruisingSpeed} kts</span>
            </div>
            <input
              type="range"
              min="8.0"
              max="22.0"
              step="0.5"
              value={cruisingSpeed}
              onChange={(e) => onChangeCruisingSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Drift Horizon Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Forecast Horizon:
              </span>
              <span className="text-amber-300 font-bold">+{forecastHours}h (3 Days)</span>
            </div>
            <input
              type="range"
              min="24"
              max="168"
              step="12"
              value={forecastHours}
              onChange={(e) => onChangeForecastHours(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>
        </div>

        {/* ── Section 3: Safety Hazard Buffer & Recalculate Trigger (Cols 3) ── */}
        <div className="md:col-span-3 space-y-2 flex flex-col justify-between h-full">
          {/* Safety Hazard Buffer */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-red-400" />
                Hazard Buffer:
              </span>
              <span className="text-red-400 font-bold">{safetyBufferKm} km ({Math.round(safetyBufferKm / 1.852)} NM)</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="5"
              value={safetyBufferKm}
              onChange={(e) => onChangeSafetyBufferKm(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Primary Recalculate CTA */}
          <button
            type="button"
            id="recalculate-route-btn"
            onClick={onRecalculate}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase
              bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600
              text-white shadow-neon-cyan transition-all duration-200 flex items-center justify-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-400/40"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Optimizing Corridor…' : 'Compute route profiles'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
