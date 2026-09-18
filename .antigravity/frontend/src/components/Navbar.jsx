import React from 'react';
import { 
  Home,
  Map,
  ThermometerSnowflake,
  PieChart,
  User,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function Navbar({ 
  loading, 
  onRefresh, 
  onOpenReport, 
  vesselIceClass, 
  forecastHours,
  isOffline,
  lastSyncedTimestamp
}) {
  const focusPanel = id => {
    const panel = document.getElementById(id);
    panel?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    panel?.focus({ preventScroll: true });
  };
  return (
    <header className="h-14 px-5 bg-[#050b18] border-b border-slate-800 flex items-center justify-between z-30 shrink-0 select-none relative">
      {/* Brand & Mission Identification */}
      <div className="flex items-center gap-3 w-1/4">
        <div className="relative flex items-center justify-center w-8 h-8">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-cyan-500">
            <path d="M12 2L2 22h20L12 2z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M12 8L6 18h12L12 8z" fill="currentColor" opacity="0.8"/>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-slate-100 flex items-center gap-2">
            PolarNav AI
          </h1>
        </div>
        <div className="h-6 w-px bg-slate-700 mx-2" />
        <div className="flex flex-col justify-center">
          <span className="text-[10px] text-slate-400 leading-tight">SIH-26059</span>
        </div>
      </div>

      {/* Center: Navigation Tabs */}
      <div className="flex-1 flex justify-center items-center gap-2">
        <span aria-current="page" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-900/40 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
          <Home className="w-4 h-4" />
          Dashboard
        </span>
        <button onClick={() => focusPanel('route-planning')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition">
          <Map className="w-4 h-4" />
          Route Planner
        </button>
        <button onClick={() => focusPanel('iceberg-forecast')} className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition">
          <ThermometerSnowflake className="w-4 h-4" />
          Forecast
        </button>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold transition" onClick={onOpenReport}>
          <PieChart className="w-4 h-4" />
          Analytics
        </button>
      </div>

      {/* Status Banner */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 w-full max-w-xl mt-2 pointer-events-none z-50">
        {loading && (
          <div role="status" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-[10px] font-bold shadow-lg">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Calculating route...
          </div>
        )}
        {isOffline && (
          <div role="status" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/80 text-amber-200 text-[11px] font-bold shadow-xl animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            OFFLINE MODE: Routing based on cached satellite data from {lastSyncedTimestamp ? new Date(lastSyncedTimestamp).toLocaleString() : 'Local Database'}
          </div>
        )}
      </div>

      {/* Right: User Profile */}
      <div className="w-1/4 flex justify-end items-center gap-3">
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300 text-xs">
          <User className="w-4 h-4 text-cyan-400" />
          Team PolarNav
        </span>
      </div>
    </header>
  );
}
