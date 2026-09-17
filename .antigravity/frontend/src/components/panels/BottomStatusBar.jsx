import React from 'react';

export default function BottomStatusBar({ timeUtc }) {
  return (
    <footer className="h-8 bg-[#050b18] border-t border-slate-800 flex items-center justify-between px-4 z-20 shrink-0 select-none">
      <div className="flex items-center gap-4 text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          SYSTEM ONLINE
        </div>
        <div className="text-slate-500 hidden sm:block">
          LAST SYNC: {timeUtc || 'SYNCING...'}
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-[10px] font-mono">
        <div className="text-slate-500 hidden sm:block">SIH-2026: PS1 - POLAR NAVIGATION</div>
        <div className="text-cyan-500 font-bold bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/50">
          A* SAFE NAV ACTIVE
        </div>
      </div>
    </footer>
  );
}
