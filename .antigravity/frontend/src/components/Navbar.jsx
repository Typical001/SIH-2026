import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Satellite, 
  Clock, 
  Wind, 
  Waves, 
  ShieldAlert, 
  RefreshCw, 
  Radio, 
  Cpu, 
  Layers
} from 'lucide-react';

export default function Navbar({ 
  loading, 
  onRefresh, 
  onOpenReport, 
  vesselIceClass, 
  forecastHours,
  systemHealth
}) {
  const [timeUtc, setTimeUtc] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLive = systemHealth?.is_live_satellite ?? true;
  const statusText = systemHealth?.header_status_text || (isLive ? "ONLINE: USNIC Satellite & ECMWF Live Sync" : "OFFLINE RESILIENCE ACTIVE: Local Shipboard Cache Running");
  const icebergCount = systemHealth?.iceberg_count;

  return (
    <header className="h-16 px-5 glass-panel border-b border-cyan-500/20 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Mission Identification */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-cyan-400 shadow-neon-cyan">
          <Compass className="w-5 h-5 animate-spin-slow text-cyan-300" />
          <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wider text-slate-100 uppercase font-mono flex items-center gap-1.5">
              PolarNav <span className="text-cyan-400">AI</span>
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-400/30 text-cyan-300">
                SIH-26059
              </span>
            </h1>
            <span className={`text-xs font-mono flex items-center gap-1 px-2.5 py-0.5 rounded-full ${
              isLive 
                ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 shadow-neon-green' 
                : 'text-amber-300 bg-amber-950/70 border border-amber-500/40'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {statusText} {icebergCount ? `(${icebergCount} Bergs)` : ''}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 tracking-wide">
            Dynamic Route Optimization & Iceberg Movement Forecasting (Southern Ocean Corridor)
          </p>
        </div>
      </div>

      {/* Center: Ingested Data Stream Status */}
      <div className="hidden xl:flex items-center gap-4 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">USNIC / NOAA:</span>
          <span className={`font-mono font-medium ${isLive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isLive ? 'LIVE GIS SYNC' : 'OFFLINE CACHE'}
          </span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Wind className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">ERA5 Winds:</span>
          <span className="text-emerald-400 font-mono font-medium">OPEN-METEO LIVE</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Waves className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">HYCOM Currents:</span>
          <span className="text-emerald-400 font-mono font-medium">OPEN-METEO LIVE</span>
        </div>
        <div className="h-3 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5 text-slate-300">
          <Radio className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">AMSR2 Sea Ice:</span>
          <span className="text-emerald-400 font-mono font-medium">FEED 100%</span>
        </div>
      </div>


      {/* Right: Mission UTC Time & Action Trigger */}
      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeUtc || '02 Sep 2026 12:00:00 UTC'}</span>
          </div>
          <span className="text-[10px] text-slate-400">
            Horizon: <strong className="text-cyan-400 font-mono">+{forecastHours}h Forecast</strong>
          </span>
        </div>

        <button
          onClick={onOpenReport}
          className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium transition flex items-center gap-1.5 hover:border-cyan-500/40"
          title="Open Comprehensive Risk & Fuel Analytics"
        >
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Analytics</span>
        </button>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs tracking-wide transition flex items-center gap-2 shadow-neon-cyan disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'CALCULATING...' : 'RECALCULATE ROUTE'}</span>
        </button>
      </div>
    </header>
  );
}
