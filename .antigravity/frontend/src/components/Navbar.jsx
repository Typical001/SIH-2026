import React, { useState, useRef, useEffect } from 'react';
import { 
  Home,
  Map,
  ThermometerSnowflake,
  PieChart,
  User,
  Loader2,
  AlertTriangle,
  LogIn,
  LogOut,
  ChevronDown,
  Ship,
  ShieldCheck,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ 
  loading, 
  onRefresh, 
  onOpenReport, 
  onOpenLogin,
  vesselIceClass, 
  forecastHours,
  isOffline,
  lastSyncedTimestamp,
  dataSource,
  dataMode = 'offline',
  onChangeDataMode
}) {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        {dataMode === 'online' ? (
          <div role="status" className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[11px] font-bold shadow-xl ${isOffline
            ? 'bg-amber-950/90 border-amber-500/80 text-amber-200 animate-pulse'
            : 'bg-emerald-950/90 border-emerald-500/70 text-emerald-200'}`}>
            {isOffline && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
            {isOffline
              ? `ONLINE MODE: Live provider unavailable; using ${dataSource || 'fallback model'}${lastSyncedTimestamp ? ` from ${new Date(lastSyncedTimestamp).toLocaleString()}` : ''}`
              : 'ONLINE MODE: Live provider data enabled'}
          </div>
        ) : isOffline ? (
          <div role="status" className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-950/90 border border-amber-500/80 text-amber-200 text-[11px] font-bold shadow-xl animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            OFFLINE MODE: Using fast analytic demo data
          </div>
        ) : null}
      </div>

      {/* Right: Data Mode Switcher & User Authentication */}
      <div className="w-1/4 flex justify-end items-center gap-3">
        <div className="flex items-center rounded-full border border-slate-700 bg-slate-900/80 p-0.5" aria-label="Data mode">
          <button
            type="button"
            aria-label="Offline data mode"
            aria-pressed={dataMode === 'offline'}
            onClick={() => onChangeDataMode?.('offline')}
            className={`px-2 py-1 rounded-full text-[9px] font-bold transition ${dataMode === 'offline' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'}`}
          >OFFLINE</button>
          <button
            type="button"
            aria-label="Online data mode"
            aria-pressed={dataMode === 'online'}
            onClick={() => onChangeDataMode?.('online')}
            className={`px-2 py-1 rounded-full text-[9px] font-bold transition ${dataMode === 'online' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'}`}
          >ONLINE</button>
        </div>

        {isAuthenticated && user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-slate-200 text-xs transition shadow-md group"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-5 h-5 rounded-full object-cover border border-cyan-400" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyan-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
              )}
              <span className="font-semibold text-cyan-200 max-w-[110px] truncate">{user.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#091327] border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-950/80 p-3 z-50 animate-fadeIn text-slate-200">
                <div className="pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white">{user.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-0.5">
                      <BadgeCheck className="w-3 h-3 text-cyan-400" />
                      {user.badge || 'Officer'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>

                <div className="py-2.5 space-y-1.5 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Role
                    </span>
                    <span className="font-medium text-slate-200">{user.role}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Ship className="w-3.5 h-3.5 text-cyan-400" /> Vessel
                    </span>
                    <span className="font-medium text-cyan-300">{user.vessel}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> Ice Class
                    </span>
                    <span className="font-medium text-emerald-300 text-[10px]">{user.iceClass}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full mt-2 py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out of Command
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-cyan-500/50 bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-600 hover:to-blue-600 text-slate-100 text-xs font-bold transition shadow-lg shadow-cyan-950/50 transform active:scale-95"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-300" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
