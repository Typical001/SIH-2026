import React from 'react';
import { X, Navigation, FileText } from 'lucide-react';
import { formatDuration, formatNumber, riskLabel } from './displayValues';
import { generateVoyageReportPDF } from '../utils/pdfGenerator';

export default function RouteComparisonModal({ 
  isOpen, 
  onClose, 
  routeMetrics, 
  vesselIceClass,
  waypoints = [],
  origin,
  destination,
  cruisingSpeed = 14.5,
  xaiExplanation = null,
  icebergsPredicted = [],
  forecastHours = 72
}) {
  if (!isOpen) return null;
  const m = routeMetrics;
  const delta = Number.isFinite(m?.distance_nautical_miles) && Number.isFinite(m?.direct_distance_nm)
    ? m.distance_nautical_miles - m.direct_distance_nm : null;
  const rows = m ? [
    ['Distance', `${formatNumber(m.distance_nautical_miles, 1)} NM`, Number.isFinite(m.direct_distance_nm) ? `${formatNumber(m.direct_distance_nm, 1)} NM` : 'Unavailable'],
    ['Estimated voyage time', formatDuration(m.estimated_voyage_hours), formatDuration(m.direct_estimated_voyage_hours)],
    ['Modeled fuel consumption', `${formatNumber(m.fuel_consumption_tons, 1)} t`, Number.isFinite(m.direct_fuel_consumption_tons) ? `${formatNumber(m.direct_fuel_consumption_tons, 1)} t` : 'Unavailable'],
    ['Model risk score (0–100)', `${formatNumber(m.risk_score, 1)} (${riskLabel(m.risk_score)})`, 'Unavailable'],
    ['Reported hazard intersections', m.geometry_validated ? 'Passed bundled obstacle checks' : 'Route clearance not verified', Array.isArray(m.direct_route_collision_hazards) ? String(m.direct_route_collision_hazards.length) : 'Unavailable']
  ] : [];

  const handleExportPDF = () => {
    if (!m) return;
    generateVoyageReportPDF({
      routeMetrics: m,
      waypoints,
      origin,
      destination,
      vesselIceClass,
      cruisingSpeed,
      xaiExplanation,
      icebergsPredicted,
      forecastHours
    });
  };

  return (
    <div className="report-overlay fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div role="dialog" aria-modal="true" aria-labelledby="report-title" className="w-full max-w-3xl glass-panel-glow rounded-2xl border border-cyan-500/40 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <h3 id="report-title" className="text-base font-bold text-white flex items-center gap-2">
            <Navigation className="w-5 h-5 text-cyan-400" />
            {m ? 'Observation-backed planning report' : 'Route analytics unavailable'}
          </h3>
          <div className="flex items-center gap-2">
            {m && (
              <button 
                onClick={handleExportPDF} 
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-neon-cyan cursor-pointer"
                title="Download Planning report PDF"
              >
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
            )}
            <button aria-label="Close analytics" onClick={onClose} className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300">
          {!m ? <p>Complete a successful route calculation to view analytics.</p> : <>
            <p>USNIC iceberg observations dated 24 September 2026, Natural Earth land and USNIC 2022 shelves. Forecasts, environmental conditions and fuel are calculated estimates. These results do not verify navigational safety.</p>
            {m.forecast_covers_voyage === false && <p className="text-amber-300">The voyage exceeds the {m.forecast_hours}h forecast by {m.uncovered_voyage_hours}h; later iceberg positions are unknown.</p>}
            {m.baseline_is_navigable === false && <p className="text-amber-300">The direct baseline fails traversal checks. Its time and fuel are hypothetical comparisons, not a usable voyage plan.</p>}
            <div className="overflow-x-auto rounded border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900"><tr><th className="p-3">Metric</th><th className="p-3 text-cyan-300">Computed route</th><th className="p-3 text-amber-300">Direct baseline</th></tr></thead>
                <tbody>{rows.map(([label, route, baseline]) => <tr key={label} className="border-t border-slate-800"><th className="p-3 font-normal">{label}</th><td className="p-3">{route}</td><td className="p-3">{baseline}</td></tr>)}</tbody>
              </table>
            </div>
            <p>Distance difference: {delta === null ? 'Unavailable' : `${delta > 0 ? '+' : ''}${formatNumber(delta, 1)} NM`}</p>
            <p>Backend modeled fuel savings: {Number.isFinite(m.fuel_savings_percent) ? `${formatNumber(m.fuel_savings_percent, 1)}%` : 'Unavailable'}. The fuel and risk models remain under review.</p>
          </>}
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 text-xs text-slate-400">
          <span>Vessel ice class: {vesselIceClass}</span>
          <div className="flex items-center gap-2">
            {m && (
              <button 
                onClick={handleExportPDF} 
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export PDF Report
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

