import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Ship, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Anchor,
  Search,
  Navigation
} from 'lucide-react';

// ── Indian Major Ports ──────────────────────────────────────────────────────
const INDIAN_PORTS = [
  { id: 'mormugao',   name: 'Mormugao (Goa)',                          lat: 15.41, lon: 73.80 },
  { id: 'mumbai',     name: 'Mumbai Port',                             lat: 18.94, lon: 72.82 },
  { id: 'jnpt',       name: 'JNPT / Nhava Sheva (Maharashtra)',        lat: 18.94, lon: 72.94 },
  { id: 'kandla',     name: 'Deendayal / Kandla (Gujarat)',            lat: 23.01, lon: 70.21 },
  { id: 'mundra',     name: 'Mundra (Gujarat)',                        lat: 22.74, lon: 69.70 },
  { id: 'cochin',     name: 'Cochin / Kochi (Kerala)',                 lat:  9.96, lon: 76.23 },
  { id: 'mangalore',  name: 'New Mangalore (Karnataka)',               lat: 12.91, lon: 74.80 },
  { id: 'chennai',    name: 'Chennai Port (Tamil Nadu)',               lat: 13.10, lon: 80.30 },
  { id: 'tuticorin',  name: 'V.O. Chidambaranar / Tuticorin',         lat:  8.75, lon: 78.21 },
  { id: 'vizag',      name: 'Visakhapatnam (Andhra Pradesh)',          lat: 17.68, lon: 83.30 },
  { id: 'paradip',    name: 'Paradip (Odisha)',                        lat: 20.26, lon: 86.66 },
  { id: 'kolkata',    name: 'Syama Prasad Mookerjee / Kolkata',       lat: 22.54, lon: 88.30 },
  { id: 'port_blair', name: 'Port Blair (Andaman & Nicobar)',         lat: 11.66, lon: 92.73 },
];

// ── Searchable Port Dropdown ────────────────────────────────────────────────
function PortSearchDropdown({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedPort = INDIAN_PORTS.find(p => p.id === value);
  const filtered = query.trim() === ''
    ? INDIAN_PORTS
    : INDIAN_PORTS.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (port) => {
    onChange(port);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 focus-within:border-cyan-400 rounded-lg px-2 py-1 cursor-text transition"
        onClick={() => setOpen(true)}
      >
        <Search className="w-3 h-3 text-slate-500 shrink-0" />
        <input
          type="text"
          value={open ? query : (selectedPort ? selectedPort.name : '')}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search Indian port…"
          className="flex-1 bg-transparent text-cyan-300 text-xs font-mono placeholder:text-slate-600 outline-none min-w-0"
        />
        {selectedPort && !open && (
          <button
            onMouseDown={handleClear}
            className="text-slate-500 hover:text-red-400 transition text-[10px] px-0.5"
            title="Clear — revert to preset origin"
          >✕</button>
        )}
      </div>

      {open && (
        <ul className="absolute bottom-full mb-1 left-0 w-full max-h-48 overflow-y-auto bg-slate-900 border border-cyan-500/30 rounded-lg shadow-xl z-50 text-xs font-mono">
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-slate-500 italic">No ports found</li>
          )}
          {filtered.map(port => (
            <li
              key={port.id}
              onMouseDown={() => handleSelect(port)}
              className={`px-3 py-1.5 cursor-pointer flex justify-between items-center gap-2 transition
                ${value === port.id
                  ? 'bg-cyan-950/80 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <span className="truncate">{port.name}</span>
              <span className="text-slate-500 shrink-0 text-[9px]">{port.lat}°N, {port.lon}°E</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Main ControlDeck ────────────────────────────────────────────────────────
export default function ControlDeck({
  selectedPreset,
  onSelectPreset,
  originOverride,
  onChangeOriginOverride,
  forecastHours,
  onChangeForecastHours,
  vesselIceClass,
  onChangeVesselIceClass,
  safetyBufferKm,
  onChangeSafetyBufferKm,
  cruisingSpeed,
  onChangeCruisingSpeed,
  layers,
  onToggleLayer,
  onRecalculate,
  loading
}) {
  const presets = [
    { id: 'cape_town_to_bharati', name: 'Cape Town ➔ Bharati Station (Larsemann Hills)' },
    { id: 'cape_town_to_maitri',  name: 'Cape Town ➔ Maitri Station (Schirmacher Oasis)' },
    { id: 'hobart_to_casey',      name: 'Hobart ➔ Casey Station (Wilkes Land)' }
  ];

  const iceClasses = [
    { id: 'Polar Class 1 (PC1)', name: 'PC1: Year-Round Heavy Polar Icebreaker' },
    { id: 'Polar Class 3 (PC3)', name: 'PC3: Year-Round Multi-Year Ice (Bharati Exp.)' },
    { id: 'Polar Class 7 (PC7)', name: 'PC7: Thin First-Year Ice Strengthened' },
    { id: 'Open Water Vessel',   name: 'Open Water: Non-Ice Strengthened Commercial' }
  ];

  // Derive which port id (if any) matches the current originOverride
  const selectedPortId = originOverride
    ? (INDIAN_PORTS.find(p => p.lat === originOverride.lat && p.lon === originOverride.lon)?.id ?? null)
    : null;

  // Local manual input state
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  // Keep manual fields in sync when port is chosen
  useEffect(() => {
    if (originOverride) {
      setManualLat(String(originOverride.lat));
      setManualLon(String(originOverride.lon));
    } else {
      setManualLat('');
      setManualLon('');
    }
  }, [originOverride]);

  const handlePortSelect = (port) => {
    onChangeOriginOverride(port ? { lat: port.lat, lon: port.lon } : null);
  };

  const handleManualLat = (val) => {
    setManualLat(val);
    const lat = parseFloat(val);
    const lon = parseFloat(manualLon);
    if (!isNaN(lat) && !isNaN(lon)) onChangeOriginOverride({ lat, lon });
  };

  const handleManualLon = (val) => {
    setManualLon(val);
    const lat = parseFloat(manualLat);
    const lon = parseFloat(val);
    if (!isNaN(lat) && !isNaN(lon)) onChangeOriginOverride({ lat, lon });
  };

  return (
    <div className="glass-panel border-t border-cyan-500/20 px-5 py-3.5 z-20 shrink-0 select-none">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

        {/* ── Section 1: Origin + Destination + Vessel (Cols 4) ── */}
        <div className="md:col-span-4 space-y-2">

          {/* Indian Port Origin */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Anchor className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-400 uppercase">Departure Port (India):</span>
              {originOverride && (
                <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400">
                  OVERRIDE
                </span>
              )}
            </div>

            <PortSearchDropdown value={selectedPortId} onChange={handlePortSelect} />

            {/* Manual lat / lon */}
            <div className="flex items-center gap-1.5">
              <Navigation className="w-3 h-3 text-slate-500 shrink-0" />
              <input
                type="number"
                step="0.0001"
                value={manualLat}
                onChange={e => handleManualLat(e.target.value)}
                placeholder="Lat (e.g. 18.94)"
                className="w-0 flex-1 bg-slate-900/70 border border-slate-700 focus:border-cyan-500/60 text-slate-300 rounded px-2 py-1 text-[11px] font-mono outline-none placeholder:text-slate-600 transition"
              />
              <input
                type="number"
                step="0.0001"
                value={manualLon}
                onChange={e => handleManualLon(e.target.value)}
                placeholder="Lon (e.g. 72.82)"
                className="w-0 flex-1 bg-slate-900/70 border border-slate-700 focus:border-cyan-500/60 text-slate-300 rounded px-2 py-1 text-[11px] font-mono outline-none placeholder:text-slate-600 transition"
              />
            </div>
          </div>

          {/* Expedition Corridor / Destination Preset */}
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-mono text-slate-400 uppercase shrink-0">Destination:</span>
            <select
              value={selectedPreset}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="flex-1 bg-slate-900/90 border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-400"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

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
        </div>

        {/* ── Section 2: Sliders (Cols 4) ── */}
        <div className="md:col-span-4 space-y-2 border-l md:border-r border-slate-800 md:px-4">
          {/* Forecast Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Drift Forecast Horizon:</span>
              </span>
              <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[11px]">
                +{forecastHours} Hours
              </span>
            </div>
            <input
              type="range" min="0" max="72" step="6" value={forecastHours}
              onChange={(e) => onChangeForecastHours(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span>0h (Now)</span><span>+24h</span><span>+48h</span>
              <span className="text-cyan-400 font-bold">+72h (Max)</span>
            </div>
          </div>

          {/* Safety Buffer Slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Iceberg Safety Hazard Buffer:</span>
              </span>
              <span className="text-emerald-400 font-bold text-[11px]">
                {safetyBufferKm} km ({Math.round(safetyBufferKm / 1.852)} NM)
              </span>
            </div>
            <input
              type="range" min="10" max="50" step="5" value={safetyBufferKm}
              onChange={(e) => onChangeSafetyBufferKm(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        {/* ── Section 3: Layer Toggles + Recalculate (Cols 4) ── */}
        <div className="md:col-span-4 space-y-2">
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            {[
              { key: 'showAStarRoute',     label: 'A* Route',       color: 'emerald' },
              { key: 'showDirectRoute',    label: 'Direct Baseline', color: 'amber' },
              { key: 'showPredictedBergs', label: '72h Icebergs',   color: 'red' },
              { key: 'showHazardBuffers',  label: 'Hazard Buffers', color: 'red' },
              { key: 'showSeaIce',         label: 'Sea Ice (SIC)',  color: 'sky' },
              { key: 'showDriftVectors',   label: 'Drift Trails',   color: 'purple' },
            ].map(({ key, label, color }) => (
              <button
                key={key}
                onClick={() => onToggleLayer(key)}
                className={`px-2 py-1 rounded-md border transition ${
                  layers[key]
                    ? `bg-${color}-950/80 border-${color}-500/50 text-${color}-300 font-bold`
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={onRecalculate}
            disabled={loading}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition flex items-center justify-center gap-2 shadow-neon-green disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'RECOMPUTING MULTI-FACTOR GRAPH...' : 'RECALCULATE A* SAFE ROUTE'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}

