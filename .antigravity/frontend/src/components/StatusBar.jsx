import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function StatusBar({ timeUtc }) {
  return (
    <footer className="h-8 px-5 bg-[#050b18] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono z-30 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          System Online
        </div>
        <div>Last updated: {timeUtc || '02 Sep 2026 12:00:00 UTC'}</div>
        <button className="flex items-center justify-center p-0.5 hover:text-cyan-400 transition">
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <span>PolarNav AI - SIH-26059</span>
        <span className="hidden md:inline">Navigating a Safer Tomorrow</span>
      </div>
    </footer>
  );
}
