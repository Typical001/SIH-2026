import React, { useState, useRef, useEffect } from 'react';
import { 
  Anchor,
  Search,
  Navigation,
  Layers,
  ThermometerSnowflake,
  ShieldCheck,
  Zap
} from 'lucide-react';

const INDIAN_PORTS = [
  { id: 'mormugao',   name: 'Mormugao (Goa)',                          lat: 15.41, lon: 73.80 },
  { id: 'mumbai',     name: 'Mumbai Port',                             lat: 18.94, lon: 72.82 },
  { id: 'jnpt',       name: 'JNPT / Nhava Sheva',                      lat: 18.94, lon: 72.94 },
  { id: 'kandla',     name: 'Deendayal / Kandla',                      lat: 23.01, lon: 70.21 },
  { id: 'mundra',     name: 'Mundra (Gujarat)',                        lat: 22.74, lon: 69.70 },
  { id: 'cochin',     name: 'Cochin / Kochi',                          lat:  9.96, lon: 76.23 },
  { id: 'mangalore',  name: 'New Mangalore',                           lat: 12.91, lon: 74.80 },
  { id: 'chennai',    name: 'Chennai Port',                            lat: 13.10, lon: 80.30 },
  { id: 'tuticorin',  name: 'Tuticorin',                               lat:  8.75, lon: 78.21 },
  { id: 'vizag',      name: 'Visakhapatnam',                           lat: 17.68, lon: 83.30 },
  { id: 'paradip',    name: 'Paradip (Odisha)',                        lat: 20.26, lon: 86.66 },
  { id: 'kolkata',    name: 'Kolkata',                                 lat: 22.54, lon: 88.30 },
  { id: 'port_blair', name: 'Port Blair',                              lat: 11.66, lon: 92.73 },
];

function PortSearchDropdown({ value, onChange, defaultName }) {
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

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 focus-within:border-cyan-400 rounded px-2 py-1 cursor-text transition w-full"
        onClick={() => setOpen(true)}
      >
        <Search className="w-3 h-3 text-slate-500 shrink-0" />
        <input
          type="text"
          aria-label="Departure port"
          value={open ? query : (selectedPort ? selectedPort.name : defaultName)}
          onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setQuery(''); } }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search port…"
          className="flex-1 bg-transparent text-cyan-300 text-[10px] font-mono placeholder:text-slate-600 outline-none min-w-0"
        />
        {selectedPort && !open && (
          <button
            aria-label="Reset to preset departure"
            onClick={(e) => { e.stopPropagation(); onChange(null); setQuery(''); setOpen(false); }}
            className="text-slate-500 hover:text-red-400 transition text-[9px] px-1"
          >✕</button>
        )}
      </div>

      {open && (
        <ul className="absolute top-full mt-1 left-0 w-full max-h-40 overflow-y-auto bg-slate-900 border border-cyan-500/30 rounded shadow-xl z-50 text-[10px] font-mono">
          {filtered.length === 0 && (
            <li className="px-2 py-1.5 text-slate-500 italic">No ports found</li>
          )}
          {filtered.map(port => (
            <li
              key={port.id}
              className={`px-2 py-1.5 cursor-pointer flex justify-between items-center gap-2 transition
                ${value === port.id
                  ? 'bg-cyan-950/80 text-cyan-300 border-l-2 border-cyan-400'
                  : 'text-slate-300 hover:bg-slate-800'
                }`}
            >
              <button type="button" className="w-full text-left" onClick={() => { onChange(port); setOpen(false); setQuery(''); }}>{port.name}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RoutePlanning({ 
  selectedPreset, onSelectPreset, 
  originOverride, onChangeOriginOverride, 
  vesselIceClass, onChangeVesselIceClass, 
  loading, onRecalculate 
}) {
  const presets = [
    { id: 'cape_town_to_bharati', name: 'Bharati Station' },
    { id: 'cape_town_to_maitri',  name: 'Maitri Station' },
    { id: 'hobart_to_casey',      name: 'Casey Station' }
  ];

  const iceClasses = [
    { id: 'Polar Class 1 (PC1)', name: 'PC1 Heavy Icebreaker' },
    { id: 'Polar Class 3 (PC3)', name: 'PC3 Multi-Year Ice' },
    { id: 'Polar Class 7 (PC7)', name: 'PC7 First-Year Ice' },
    { id: 'Open Water Vessel',   name: 'Open Water Vessel' }
  ];

  const selectedPortId = originOverride
    ? (INDIAN_PORTS.find(p => p.lat === originOverride.lat && p.lon === originOverride.lon)?.id ?? null)
    : null;

  return (
    <div id="route-planning" tabIndex={-1} className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2.5">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider mb-1">
        <Anchor className="w-3.5 h-3.5 text-cyan-400" />
        Route Planning
      </h2>
      <div className="space-y-2">
        <div className="space-y-1">
          <label className="text-[9px] font-mono text-slate-400 uppercase">From</label>
          <PortSearchDropdown value={selectedPortId} defaultName={originOverride ? `${originOverride.lat}, ${originOverride.lon}` : selectedPreset === 'hobart_to_casey' ? 'Hobart' : 'Cape Town'} onChange={(p) => onChangeOriginOverride(p ? { lat: p.lat, lon: p.lon, name: p.name } : null)} />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-mono text-slate-400 uppercase">To</label>
          <select
            aria-label="Destination station"
            value={selectedPreset}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 text-cyan-300 rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-cyan-400"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-mono text-slate-400 uppercase">Ship Type</label>
          <select
            aria-label="Vessel ice class"
            value={vesselIceClass}
            onChange={(e) => onChangeVesselIceClass(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/80 text-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-cyan-400"
          >
            {iceClasses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={onRecalculate}
        disabled={loading}
        className="w-full mt-2 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] tracking-wider transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
      >
        <Zap className={`w-3 h-3 ${loading ? 'animate-pulse text-amber-300' : ''}`} />
        <span>{loading ? 'OPTIMIZING...' : 'OPTIMIZE ROUTE'}</span>
      </button>
    </div>
  );
}

function IcebergForecast({ forecastHours, onChangeForecastHours, onRecalculate, loading }) {
  return (
    <div id="iceberg-forecast" tabIndex={-1} className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2.5">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider mb-1">
        <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
        Iceberg Forecast
      </h2>
      <div className="space-y-1">
        <label className="text-[9px] font-mono text-slate-400 uppercase">Forecast Horizon</label>
        <select
          aria-label="Forecast horizon"
          value={forecastHours}
          onChange={(e) => onChangeForecastHours(Number(e.target.value))}
          className="w-full bg-slate-900/80 border border-slate-700/80 text-slate-200 rounded px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-cyan-400"
        >
          <option value="24">Next 24 Hours</option>
          <option value="48">Next 48 Hours</option>
          <option value="72">Next 72 Hours</option>
        </select>
      </div>
      <button
        onClick={onRecalculate}
        disabled={loading}
        className="w-full py-1.5 rounded bg-slate-800 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-700 text-slate-200 font-bold text-[10px] tracking-wider transition flex items-center justify-center gap-1.5 cursor-pointer"
      >
        RUN FORECAST
      </button>
    </div>
  );
}

function MapLayers({ layers, onToggleLayer }) {
  const layerConfigs = [
    { key: 'showAStarRoute',     label: 'A* Computed Route',       color: 'cyan' },
    { key: 'showDirectRoute',    label: 'Direct Baseline',     color: 'cyan' },
    { key: 'showPredictedBergs', label: 'Predicted Icebergs',  color: 'cyan' },
    { key: 'showPresentBergs',   label: 'Present Icebergs',    color: 'cyan' },
    { key: 'showHazardBuffers',  label: 'Hazard Buffers',      color: 'cyan' },
    { key: 'showSeaIce',         label: 'Illustrative Ice Zones',       color: 'cyan' },
    { key: 'showDriftVectors',   label: 'Drift Trails',        color: 'cyan' },
    { key: 'showMetoceanGrid',   label: 'Metocean Grid (unavailable)', disabled: true },
  ];

  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2.5">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider mb-1">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        Layers
      </h2>
      <div className="space-y-1.5">
        {layerConfigs.map(({ key, label, disabled }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={!disabled && layers[key]}
                disabled={disabled}
                onChange={() => onToggleLayer(key)}
                className="sr-only"
              />
              <div className={`w-3 h-3 rounded-sm border transition ${
                layers[key] 
                  ? 'bg-cyan-600 border-cyan-400'
                  : 'bg-slate-900 border-slate-600 group-hover:border-slate-400'
              }`}>
                {layers[key] && <div className="absolute inset-0 m-auto w-1.5 h-1.5 bg-white rounded-[1px]"></div>}
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-300 group-hover:text-white transition">
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function LeftControls(props) {
  return (
    <aside className="w-64 h-full bg-[#050b18] border-r border-slate-800 flex flex-col z-20 shrink-0 select-none overflow-y-auto">
      <div className="p-3 space-y-3 flex-1">
        <RoutePlanning {...props} />
        <IcebergForecast {...props} />
        <MapLayers {...props} />
      </div>
    </aside>
  );
}
