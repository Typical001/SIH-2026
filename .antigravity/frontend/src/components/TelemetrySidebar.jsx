import React from 'react';
import { 
  Gauge, 
  ShieldCheck, 
  Fuel, 
  Navigation, 
  Clock, 
  AlertTriangle, 
  Waves, 
  Activity, 
  CheckCircle2, 
  Sparkles, 
  Zap, 
  Info, 
  Sliders, 
  AlertOctagon,
  Layers,
  Check
} from 'lucide-react';

export default function TelemetrySidebar({ 
  routeMetrics, 
  vesselIceClass, 
  cruisingSpeed = 14.5, 
  loading,
  paretoRoutes = null,
  activeRouteType = 'BALANCED',
  remainingFuelMt = 200.0,
  onChangeRemainingFuel = () => {},
  maxTankCapacityMt = 200.0,
  onSelectRouteType = () => {},
  layerVisibility = {
    seaIce: false,
    refIcebergs: true,
    sarCandidates: true,
    predictedIcebergs: true,
    riskHeatmap: true,
    optimizedRoutes: true,
    oceanCurrents: false,
    weatherWind: true,
    bathymetry: false
  },
  onToggleLayer = () => {},
  layersSyncStatus = 'LIVE: NOAA/BYU/ECMWF',
}) {
  const MAP_LAYERS = [
    { key: 'seaIce',            name: 'Sea Ice Concentration',   source: 'AMSR2 25 km grid',          color: '#38bdf8', icon: '❄️' },
    { key: 'refIcebergs',       name: 'Reference Icebergs',       source: 'BYU MERS validated tracks', color: '#c084fc', icon: '📍' },
    { key: 'sarCandidates',     name: 'SAR Candidates',           source: 'Sentinel-1 radar detections',color: '#06b6d4', icon: '🛰️' },
    { key: 'predictedIcebergs', name: 'Official Icebergs',        source: 'USNIC / NOAA FeatureServer',color: '#f87171', icon: '🔺' },
    { key: 'oceanCurrents',     name: 'Ocean Currents',           source: 'GLORYS / HYCOM surface',    color: '#60a5fa', icon: '🌊' },
    { key: 'weatherWind',       name: 'Weather Wind Vectors',     source: 'ECMWF ERA5 / IFS 10m wind', color: '#fbbf24', icon: '💨' },
    { key: 'bathymetry',        name: 'Bathymetry Contours',      source: 'GEBCO NOAA NCEI WMS',       color: '#818cf8', icon: '🗺️' },
    { key: 'riskHeatmap',       name: 'POLARIS Risk Heatmap',     source: 'IMO RIO corridor matrix',   color: '#fb7185', icon: '🔥' },
    { key: 'optimizedRoutes',   name: 'Optimized Pareto Routes',  source: 'Safest / Balanced / Fastest', color: '#34d399', icon: '🧭' },
  ];

  const PROFILE_META = {
    SAFEST:   { emoji: '🛡️', label: 'Safest',   color: '#10b981', badge: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300', tag: 'SAFE' },
    BALANCED: { emoji: '⚡',    label: 'Balanced', color: '#0ea5e9', badge: 'bg-sky-950/80 border-sky-500/40 text-sky-300',         tag: 'OPTIMAL' },
    FASTEST:  { emoji: '⏱️',  label: 'Fastest',  color: '#f59e0b', badge: 'bg-amber-950/80 border-amber-500/40 text-amber-300',     tag: 'HIGH RISK' },
  };

  const activeMeta = PROFILE_META[activeRouteType] || PROFILE_META.BALANCED;
  const activeFeature = paretoRoutes?.features?.find(f => f.properties?.route_type === activeRouteType);
  const activeProps = activeFeature?.properties;

  // Live bunker endurance calculations
  const speedRatio = Math.max(0.5, Math.min(2.5, cruisingSpeed / 12.0));
  const hourlyBurnRate = (35.0 / 24.0) * Math.pow(speedRatio, 2.0) * 0.180;
  const dailyBurnRate = hourlyBurnRate * 24.0;
  const enduranceDays = (remainingFuelMt / Math.max(0.1, dailyBurnRate)).toFixed(1);
  const enduranceNm = Math.round(Number(enduranceDays) * 24 * cruisingSpeed);
  const bunkerCapacityPct = Math.min(100, Math.round((remainingFuelMt / maxTankCapacityMt) * 100));

  const isAutoSwitched = Boolean(paretoRoutes?.metadata?.auto_switched);
  const autoSwitchedMsg = paretoRoutes?.metadata?.auto_switched_message;

  const metrics = routeMetrics;
  const isLowRisk = metrics ? metrics.risk_score < 30 : true;
  const isModerateRisk = metrics ? (metrics.risk_score >= 30 && metrics.risk_score < 60) : false;

  return (
    <aside className="w-84 md:w-88 h-full glass-panel border-r border-cyan-500/20 flex flex-col z-20 shrink-0 select-none overflow-y-auto custom-scrollbar">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">
            Mission Telemetry & Bunker
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          ECDIS ONLINE
        </span>
      </div>

      <div className="p-3.5 space-y-3.5 flex-1">

        {/* ── BRIDGE BUNKER FUEL METER (INTERACTIVE WIDGET) ── */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-[#07162c] border border-cyan-500/40 shadow-neon-cyan space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-cyan-400" />
              BRIDGE BUNKER FUEL
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-extrabold text-white">{remainingFuelMt.toFixed(1)}</span>
              <span className="text-xs text-cyan-400 font-semibold">MT</span>
            </div>
          </div>

          {/* Interactive Fuel Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-cyan-400" /> Bunker Tank Level
              </span>
              <span className={`font-bold ${
                bunkerCapacityPct > 30 ? 'text-emerald-400' : bunkerCapacityPct >= 15 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {bunkerCapacityPct}% ({remainingFuelMt} / {maxTankCapacityMt} MT)
              </span>
            </div>

            <input
              type="range"
              id="bunker-fuel-slider"
              min="0"
              max="500"
              step="5"
              value={remainingFuelMt}
              onChange={(e) => onChangeRemainingFuel(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-all"
            />

            {/* Quick Preset Buttons */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              {[
                { label: '120 MT', val: 120, tag: 'Low' },
                { label: '140 MT', val: 140, tag: 'Choke' },
                { label: '200 MT', val: 200, tag: 'Norm' },
                { label: '350 MT', val: 350, tag: 'Ext' },
              ].map(preset => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => onChangeRemainingFuel(preset.val)}
                  className={`px-1.5 py-1 text-[10px] rounded border transition-all ${
                    remainingFuelMt === preset.val
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-sm'
                      : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bunker Tank Level Gauge Bar */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex p-0.5 border border-slate-700/60">
              <div 
                className={`h-full transition-all duration-300 rounded-full ${
                  bunkerCapacityPct > 30 
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-neon-green' 
                    : bunkerCapacityPct >= 15 
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                      : 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, bunkerCapacityPct))}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>0 MT</span>
              <span className="text-amber-400">15% Polar Reserve</span>
              <span>{maxTankCapacityMt} MT</span>
            </div>
          </div>

          {/* Live Vessel Endurance Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-400" /> Endurance
              </div>
              <div className="text-sm font-bold text-white mt-0.5 flex items-baseline gap-1">
                <span>{enduranceDays}</span>
                <span className="text-[10px] text-slate-400 font-normal">Days</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-emerald-400" /> Range
              </div>
              <div className="text-sm font-bold text-white mt-0.5 flex items-baseline gap-1">
                <span>{enduranceNm.toLocaleString()}</span>
                <span className="text-[10px] text-slate-400 font-normal">NM</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── AUTO-PROMOTION / CORRIDOR SWITCH ALERT BANNER ── */}
        {(isAutoSwitched || remainingFuelMt < 142.0) && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/60 shadow-lg text-xs font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" />
              <span>BUNKER AUTO-SWITCH ACTIVE</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              {autoSwitchedMsg || "Safest route detour requires 142 MT which exceeds bunker endurance. Auto-switched to Balanced corridor."}
            </p>
          </div>
        )}

        {/* ── ROUTE CANDIDATES & BUNKER FEASIBILITY CARDS ── */}
        <div className="space-y-2 font-mono">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Route Candidates (Pareto)</span>
            <span className="text-[10px] text-slate-500 font-normal">Select Active Route</span>
          </div>

          {['SAFEST', 'BALANCED', 'FASTEST'].map((rType) => {
            const meta = PROFILE_META[rType];
            const feat = paretoRoutes?.features?.find(f => f.properties?.route_type === rType);
            const props = feat?.properties;
            
            // Standard calibrated burns
            const burnMt = props?.total_fuel_burn_mt ?? (rType === 'SAFEST' ? 142.0 : rType === 'BALANCED' ? 117.9 : 103.7);
            const tankLeftPct = props?.tank_left_percentage ?? Math.max(0, Math.round(((remainingFuelMt - burnMt) / maxTankCapacityMt) * 100));
            const status = props?.feasibility_status ?? (remainingFuelMt < burnMt ? 'UNREACHABLE' : (remainingFuelMt - burnMt * 1.15 < 0 ? 'RANGE_CRITICAL' : 'FEASIBLE'));
            
            const isUnreachable = status === 'UNREACHABLE' || (rType === 'SAFEST' && remainingFuelMt < 142.0);
            const isSelected = activeRouteType === rType;

            return (
              <div
                key={rType}
                id={`route-card-${rType.toLowerCase()}`}
                onClick={() => {
                  if (!isUnreachable) {
                    onSelectRouteType(rType);
                  }
                }}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isUnreachable
                    ? 'opacity-60 bg-red-950/20 border-red-500/40 cursor-not-allowed'
                    : isSelected
                      ? `bg-slate-900 border-2 shadow-lg cursor-pointer`
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                }`}
                style={isSelected && !isUnreachable ? { borderColor: meta.color, boxShadow: `0 0 14px ${meta.color}30` } : {}}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-100">
                    <span>{meta.emoji}</span>
                    <span style={{ color: isUnreachable ? '#f87171' : meta.color }}>{meta.label}</span>
                    {isSelected && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-400/40">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  {isUnreachable ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 border border-red-500 text-red-300 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> UNREACHABLE
                    </span>
                  ) : status === 'RANGE_CRITICAL' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-500 text-amber-300 font-bold">
                      RESERVE RISK
                    </span>
                  ) : (
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${meta.badge}`}>
                      [{meta.tag}]
                    </span>
                  )}
                </div>

                {/* Card Fuel & Transit Readout */}
                <div className="mt-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Burn: <strong className="text-white font-semibold">{burnMt.toFixed(0)} MT</strong></span>
                    <span>Tank Left: <strong className={tankLeftPct > 20 ? 'text-emerald-400' : 'text-amber-400'}>{tankLeftPct}%</strong></span>
                  </div>

                  {props && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span>Dist: {props.distance_nm} NM</span>
                      <span>ETA: {props.eta_hours}h</span>
                      <span>RIO: {props.min_polaris_rio}</span>
                    </div>
                  )}

                  {/* Prompt required warning for Safest detour if fuel < 142 MT */}
                  {isUnreachable && (
                    <div className="mt-1.5 p-1.5 rounded bg-red-950/80 border border-red-500/50 text-[10px] text-red-200 font-bold flex items-center gap-1">
                      <span>⚠️ INSUFFICIENT FUEL FOR DETOUR</span>
                    </div>
                  )}

                  {rType === 'BALANCED' && isAutoSwitched && (
                    <div className="mt-1.5 p-1 rounded bg-sky-950/80 border border-sky-500/50 text-[10px] text-sky-300 font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-sky-400" />
                      <span>RECOMMENDED FEASIBLE CORRIDOR</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── MAP DISPLAY LAYERS (LIVE TICK-MARK CONTROLS) ── */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              MAP DISPLAY LAYERS
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border flex items-center gap-1 font-bold ${
              layersSyncStatus?.startsWith('LIVE')
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                layersSyncStatus?.startsWith('LIVE') ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              {layersSyncStatus || 'LIVE: NOAA/BYU/ECMWF'}
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {MAP_LAYERS.map(layer => {
              const isChecked = Boolean(layerVisibility[layer.key]);
              return (
                <div
                  key={layer.key}
                  id={`layer-toggle-${layer.key}`}
                  onClick={() => onToggleLayer(layer.key)}
                  className={`flex items-center justify-between p-1.5 rounded-lg border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-slate-800/90 border-slate-700 text-slate-100 shadow-sm'
                      : 'bg-slate-950/40 border-slate-900/80 text-slate-500 hover:border-slate-800 hover:text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Custom Tick-Mark Box */}
                    <button
                      type="button"
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
                          : 'border-slate-700 bg-slate-900 text-transparent'
                      }`}
                      style={isChecked ? { backgroundColor: layer.color, borderColor: layer.color } : {}}
                    >
                      <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
                    </button>

                    <div className="truncate">
                      <div className="text-[11px] font-semibold flex items-center gap-1 truncate">
                        <span>{layer.icon}</span>
                        <span className={isChecked ? 'text-slate-200' : 'text-slate-400'}>{layer.name}</span>
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">{layer.source}</div>
                    </div>
                  </div>

                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: isChecked ? layer.color : '#334155' }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── METOCEAN & RISK READOUTS ── */}
        {metrics && (
          <>
            {/* Primary Metric 1: Ice Hazard Level & Risk Score */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono">
                  <ShieldCheck className={`w-4 h-4 ${isLowRisk ? 'text-emerald-400' : isModerateRisk ? 'text-amber-400' : 'text-red-400'}`} />
                  ICE HAZARD LEVEL
                </span>
                <span className="text-[10px] font-mono text-slate-400">Buffer: {metrics.iceberg_hazard_buffer_km}km</span>
              </div>

              <div className="flex items-baseline justify-between">
                <span className={`text-base font-bold font-mono tracking-wide ${
                  isLowRisk ? 'text-emerald-400' : isModerateRisk ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {metrics.risk_rating}
                </span>
                <span className="text-xs font-mono text-slate-300">
                  Risk Index: <strong className="text-cyan-300">{metrics.risk_score}%</strong>
                </span>
              </div>

              {/* Risk Gauge Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                <div 
                  className={`h-full transition-all duration-500 rounded-full ${
                    isLowRisk ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : isModerateRisk ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(10, metrics.risk_score * 2.5))}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                <span>Min Iceberg Distance:</span>
                <strong className="text-slate-200 font-mono">{metrics.min_iceberg_distance_km} km</strong>
              </div>
            </div>

            {/* Metocean & Ice Environment Readout */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="text-slate-300 font-semibold flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                <Waves className="w-4 h-4 text-blue-400" />
                <span>SOUTHERN OCEAN CONDITIONS</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>ACC Current Jet:</span>
                  <strong className="text-cyan-300">0.45 kts (Eastward)</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Sea Ice (SIC):</span>
                  <strong className="text-sky-300">{metrics.max_sea_ice_concentration_pct}%</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Roaring 40s Winds:</span>
                  <strong className="text-emerald-300">22.4 kts Westerly</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vessel Ice Class:</span>
                  <strong className="text-indigo-300">{vesselIceClass}</strong>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80 text-center text-[10px] font-mono text-slate-400">
        SIH 26059 // IMO POLARIS BUNKER FEASIBILITY ENGINE
      </div>
    </aside>
  );
}
