import React from 'react';
export default function Navbar({loading,onRefresh,onOpenReport,onExportPDF,forecastHours,systemHealth}) {
 return <header className="px-4 py-3 bg-slate-950 border-b border-slate-700 flex flex-wrap gap-3 justify-between text-slate-100">
  <div><h1 className="font-bold text-lg">PolarNav · Passage planner</h1><p className="text-xs text-cyan-300">{systemHealth?.header_status_text || 'Loading dated observations'} · {systemHealth?.iceberg_count ?? '—'} icebergs</p></div>
  <div className="flex items-center gap-3 text-xs"><span>Estimated horizon +{forecastHours}h</span>
   <button disabled={loading} onClick={onExportPDF} className="px-3 py-2 border rounded">Export PDF</button>
   <button onClick={onOpenReport} className="px-3 py-2 border rounded">Voyage report</button>
   <button disabled={loading} onClick={onRefresh} className="px-3 py-2 bg-cyan-700 rounded">{loading?'Calculating…':'Recalculate route'}</button>
  </div>
 </header>;
}
