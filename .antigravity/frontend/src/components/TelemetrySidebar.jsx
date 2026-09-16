import React from 'react';
import { 
  Gauge, 
  ShieldCheck, 
  ShieldAlert, 
  Fuel, 
  Navigation, 
  Clock, 
  Compass, 
  ThermometerSnowflake, 
  TrendingUp, 
  AlertTriangle, 
  Wind, 
  Waves, 
  Anchor,
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function TelemetrySidebar({ 
  routeMetrics, 
  vesselIceClass, 
  cruisingSpeed, 
  loading 
}) {
  if (!routeMetrics) {
    return (
      <aside className="w-80 h-full glass-panel border-r border-cyan-500/20 p-4 z-20 shrink-0">
        <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">Mission Telemetry</h2>
        <div role="status" className="mt-4 rounded-xl border border-slate-700 bg-slate-900/90 p-4 text-sm text-slate-300">
          <p className="font-semibold">{loading ? 'Calculating route…' : 'No route results available.'}</p>
          <p className="mt-2 text-xs text-slate-400">Distance, voyage time and risk will appear after a successful calculation.</p>
        </div>
      </aside>
    );
  }
  const metrics = routeMetrics;

  const isLowRisk = metrics.risk_score < 30;
  const isModerateRisk = metrics.risk_score >= 30 && metrics.risk_score < 60;

  return (
    <aside className="w-80 h-full glass-panel border-r border-cyan-500/20 flex flex-col z-20 shrink-0 select-none overflow-y-auto">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">
            Mission Telemetry
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          RESULTS
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Latency Compensation & Physics Engine Status Badge */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-500/30 text-xs font-mono space-y-1.5 shadow-neon-cyan">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              LATENCY COMPENSATION
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-200 border border-cyan-400/30">
              AI REALTIME
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            Status: <strong className="text-emerald-400">{metrics.latency_compensation_status}</strong>
          </div>
          <p className="text-[10px] text-slate-400">
            ERA5 Wind Drag + HYCOM Keel Drift physics integrated across +72h planning window.
          </p>
        </div>

        {/* Primary Metric 1: Ice Hazard Level & Risk Score */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className={`w-4 h-4 ${isLowRisk ? 'text-emerald-400' : isModerateRisk ? 'text-amber-400' : 'text-red-400'}`} />
              ICE HAZARD LEVEL
            </span>
            <span className="text-[10px] font-mono text-slate-400">Safety Buffer: {metrics.iceberg_hazard_buffer_km}km</span>
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

        {/* Primary Metric 2: Fuel Savings & Distance */}
        <div className="grid grid-cols-2 gap-3">
          {/* Fuel Savings Card */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Fuel className="w-3.5 h-3.5 text-emerald-400" />
              <span>FUEL SAVINGS</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 flex items-baseline gap-0.5">
              <span>+{metrics.fuel_savings_percent}</span>
              <span className="text-xs font-normal text-emerald-300">%</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Estimated: {metrics.fuel_consumption_tons} T
            </div>
          </div>

          {/* Vessel Cruising Speed */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>VESSEL SPEED</span>
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 flex items-baseline gap-0.5">
              <span>{cruisingSpeed || 14.5}</span>
              <span className="text-xs font-normal text-cyan-400">kts</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Throttle: Optimal Cruising
            </div>
          </div>
        </div>

        {/* Voyage Distance & ETA Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Navigation className="w-4 h-4 text-cyan-400" />
              VOYAGE DISTANCE
            </span>
            <span className="text-sm font-bold text-white">
              {metrics.distance_nautical_miles.toLocaleString()} <span className="text-[10px] font-normal text-cyan-400">NM</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-4 h-4 text-sky-400" />
              ESTIMATED TIME (ETA)
            </span>
            <span className="text-sm font-bold text-sky-300">
              {metrics.estimated_voyage_days} <span className="text-[10px] font-normal text-slate-400">Days</span>
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Direct Geodesic Dist:</span>
            <span className="text-slate-300">{metrics.direct_distance_nm} NM</span>
          </div>
        </div>

        {/* Iceberg Threat Neutralization Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              HAZARDS AVOIDED
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 font-bold text-[10px]">
              {metrics.icebergs_avoided_count} CATALOG BERGS
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Direct Path Collision Threats:
          </div>

          <div className="flex flex-wrap gap-1.5">
            {metrics.direct_route_collision_hazards && metrics.direct_route_collision_hazards.length > 0 ? (
              metrics.direct_route_collision_hazards.map((id, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-300 text-[10px]">
                  ⚠️ {id}
                </span>
              ))
            ) : (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> All clear
              </span>
            )}
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
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-center text-[10px] font-mono text-slate-400">
        SIH 26059 // ANTARCTIC ROUTE OPTIMIZER
      </div>
    </aside>
  );
}
