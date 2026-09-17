import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ThermometerSnowflake, 
  AlertTriangle, 
  Map,
  BrainCircuit,
  X
} from 'lucide-react';

function RouteOverview({ metrics, safetyColor, isLowRisk, isModerateRisk }) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-3">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider">
        <Map className="w-3.5 h-3.5 text-cyan-400" />
        Route Overview
      </h2>
      
      <div className="grid grid-cols-3 gap-1">
        <div className="space-y-0.5">
          <div className="text-[9px] text-slate-400 uppercase font-mono">Distance</div>
          <div className="text-xs font-bold text-slate-200">{metrics.distance_km.toFixed(0)} km</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[9px] text-slate-400 uppercase font-mono">Est. Time</div>
          <div className="text-xs font-bold text-slate-200">{Math.floor(metrics.estimated_voyage_hours / 24)}d {Math.round(metrics.estimated_voyage_hours % 24)}h</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-[9px] text-slate-400 uppercase font-mono">Fuel Est.</div>
          <div className="text-xs font-bold text-slate-200">{metrics.fuel_consumption_tons.toFixed(0)} t</div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-slate-300 font-mono">
          <ShieldCheck className={`w-3.5 h-3.5 text-${safetyColor}-400`} />
          Route Safety
        </div>
        <div className={`px-1.5 py-0.5 rounded-sm bg-${safetyColor}-950/50 border border-${safetyColor}-500/30 text-${safetyColor}-400 text-[9px] font-bold`}>
          {isLowRisk ? 'High' : isModerateRisk ? 'Medium' : 'Low'}
        </div>
      </div>
    </div>
  );
}

function RouteComparison({ metrics }) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider">
        <Map className="w-3.5 h-3.5 text-slate-400" />
        Route Comparison
      </h2>
      <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div className="space-y-0.5 w-2/5">
          <div className="text-[9px] text-cyan-400 font-mono leading-tight">Optimized</div>
          <div className="text-[10px] text-slate-200 font-bold leading-tight">{Math.floor(metrics.estimated_voyage_hours / 24)}d {Math.round(metrics.estimated_voyage_hours % 24)}h</div>
          <div className="text-[9px] text-slate-400 leading-tight">{metrics.distance_km.toFixed(0)} km</div>
        </div>
        <div className="text-slate-600 font-bold text-[9px]">VS</div>
        <div className="space-y-0.5 w-2/5 text-right">
          <div className="text-[9px] text-slate-400 font-mono leading-tight">Shortest</div>
          <div className="text-[10px] text-slate-200 font-bold leading-tight">{Math.floor(metrics.estimated_voyage_hours / 24)}d {Math.round((metrics.estimated_voyage_hours + 12) % 24)}h</div>
          <div className="text-[9px] text-slate-400 leading-tight">{(metrics.distance_km * 1.05).toFixed(0)} km</div>
        </div>
      </div>
    </div>
  );
}

function WhyThisRoute({ xaiExplanation, loading }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider">
          <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
          Why This Route?
        </h2>
      </div>

      {loading ? (
        <div className="text-[10px] text-slate-400 italic">Generating route explanation...</div>
      ) : !xaiExplanation ? (
        <div className="text-[10px] text-slate-400 italic">Route explanation unavailable</div>
      ) : (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-300 leading-snug">
            {xaiExplanation.primary_routing_driver}
          </div>
          
          <div className="space-y-1.5">
            {xaiExplanation.route_modifiers?.max_sea_ice_penalty_pct !== undefined && (
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-slate-400 font-mono">Sea Ice Penalty</span>
                <span className="text-amber-400 font-bold">+{xaiExplanation.route_modifiers.max_sea_ice_penalty_pct}% cost</span>
              </div>
            )}
            {xaiExplanation.route_modifiers?.iceberg_proximity_caution !== undefined && (
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-slate-400 font-mono">Hazard Caution</span>
                <span className="text-cyan-400 font-bold">+{xaiExplanation.route_modifiers.iceberg_proximity_caution} weight</span>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsOpen(true)}
            className="text-[9px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 w-full text-left"
          >
            View detailed explanation ➔
          </button>
        </div>
      )}

      {isOpen && xaiExplanation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#0a1122] border border-slate-700 rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#050b18]">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-indigo-400" />
                Detailed AI Route Explanation
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Primary Driver</div>
                <div className="text-sm text-slate-200">{xaiExplanation.primary_routing_driver}</div>
              </div>
              
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Waypoint Decisions (Sampled)</div>
                <div className="space-y-2">
                  {xaiExplanation.waypoint_explanations?.map((wp, idx) => (
                    <div key={idx} className="bg-slate-900/50 rounded border border-slate-800 p-2 text-[10px]">
                      <div className="flex justify-between text-slate-400 mb-1 font-mono">
                        <span>Lat: {wp.lat.toFixed(2)}</span>
                        <span>Lon: {wp.lon.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                        <div className="text-slate-300">SIC: <span className="text-white font-mono">{wp.decision_factors.sic_value}</span></div>
                        <div className="text-slate-300">Ice Penalty: <span className="text-white font-mono">{wp.decision_factors.ice_penalty_applied}</span></div>
                        <div className="text-slate-300">Current (kts): <span className="text-white font-mono">{wp.decision_factors.ocean_current_spd_kts}</span></div>
                        <div className="text-slate-300">Wind (kts): <span className="text-white font-mono">{wp.decision_factors.wind_spd_kts}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IcebergForecastChart({ icebergsPredicted, forecastHours }) {
  // Extract time steps based on forecastHours (e.g., 24, 48, 72)
  const hours = forecastHours || 72;
  const stepsCount = hours / 24;
  const timeSteps = ['0h'];
  for (let i = 1; i <= stepsCount; i++) {
    timeSteps.push(`${i * 24}h`);
  }

  // Calculate Average Drift Speed (kts) at each step from actual API data
  const seriesData = timeSteps.map((step, idx) => {
    let sumSpeed = 0;
    let count = 0;
    if (icebergsPredicted && Array.isArray(icebergsPredicted)) {
      icebergsPredicted.forEach(berg => {
        if (berg.snapshots && berg.snapshots[step] && berg.snapshots[step].speed_knots !== undefined) {
          sumSpeed += berg.snapshots[step].speed_knots;
          count++;
        }
      });
    }
    const avgSpeed = count > 0 ? (sumSpeed / count) : 0;
    return { time: step, value: avgSpeed, x: idx, count };
  });

  const hasData = seriesData.some(d => d.count > 0);

  // Calculate coordinates for SVG
  const width = 200;
  const height = 60;
  
  const maxValue = Math.max(0.1, ...seriesData.map(d => d.value)) * 1.5; // Add some headroom
  
  const getX = (idx) => (idx / Math.max(1, timeSteps.length - 1)) * width;
  const getY = (val) => height - (val / maxValue) * height;

  const points = seriesData.map(d => `${getX(d.x)},${getY(d.value)}`).join(' ');
  const areaPoints = `${getX(0)},${height} ${points} ${getX(seriesData.length - 1)},${height}`;

  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider">
          <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-400" />
          Iceberg Forecast
        </h2>
        <span className="text-[9px] text-slate-500">(Next {hours/24} Days)</span>
      </div>
      
      {!hasData ? (
        <div className="h-24 w-full bg-[#07101f] rounded border border-slate-800 flex items-center justify-center">
          <span className="text-[10px] text-slate-400 italic">No forecast data available</span>
        </div>
      ) : (
        <div className="h-24 w-full bg-[#07101f] rounded border border-slate-800 relative flex flex-col pt-2 px-2 pb-1">
           <div className="flex items-center gap-2 text-[8px] text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1"><span className="w-2 h-[2px] bg-cyan-400"></span> Avg Drift Speed (kts)</span>
           </div>
           
           <div className="flex-1 relative w-full h-full">
              {/* Y-axis grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className="w-full border-t border-slate-800/50 h-0"></div>
                 ))}
              </div>
              
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="rgb(34 211 238)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#lineGradient)" />
                <polyline points={points} fill="none" stroke="rgb(34 211 238)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Data points */}
                {seriesData.map((d, i) => (
                  <circle key={i} cx={getX(d.x)} cy={getY(d.value)} r="2.5" fill="#050b18" stroke="rgb(34 211 238)" strokeWidth="1.5" />
                ))}
              </svg>
           </div>

           {/* X-axis labels */}
           <div className="flex justify-between w-full mt-1 text-[8px] text-slate-500 font-mono">
              {timeSteps.map((step, i) => (
                <span key={i}>{step}</span>
              ))}
           </div>
        </div>
      )}
    </div>
  );
}

function AlertsPanel({ metrics }) {
  return (
    <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-slate-100 uppercase tracking-wider">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          System Alerts
        </h2>
        <button className="text-[9px] text-cyan-400 hover:text-cyan-300">View All ➔</button>
      </div>
      
      <div className="space-y-1.5 overflow-y-auto max-h-32 pr-1">
        {metrics.direct_route_collision_hazards && metrics.direct_route_collision_hazards.length > 0 ? (
          <div className="flex gap-2 p-2 rounded bg-red-950/20 border border-red-900/30">
            <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-red-400 leading-tight flex items-center justify-between">
                High iceberg concentration
                <span className="text-[8px] text-slate-500 font-normal ml-2">2 hrs ago</span>
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">Lat -69.4°S, Lon 76.1°E</div>
            </div>
          </div>
        ) : null}

        <div className="flex gap-2 p-2 rounded bg-amber-950/20 border border-amber-900/20">
          <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-400 leading-tight flex items-center justify-between">
              Weather condition change
              <span className="text-[8px] text-slate-500 font-normal ml-2">5 hrs ago</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">Wind speed increased to 22 knots</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DecisionSupport({ 
  routeMetrics, 
  vesselIceClass, 
  cruisingSpeed, 
  loading,
  xaiExplanation,
  icebergsPredicted,
  forecastHours
}) {
  if (loading || !routeMetrics) {
    return (
      <aside className="w-64 h-full bg-[#050b18] border-l border-slate-800 flex flex-col z-20 shrink-0 overflow-y-auto">
        <div role="status" className="p-3 text-xs text-slate-400">
          {loading ? 'Calculating route...' : 'No route results available.'}
        </div>
      </aside>
    );
  }

  const metrics = routeMetrics;

  const isLowRisk = metrics.risk_score < 30;
  const isModerateRisk = metrics.risk_score >= 30 && metrics.risk_score < 60;
  const safetyColor = isLowRisk ? 'emerald' : isModerateRisk ? 'amber' : 'red';

  return (
    <aside className="w-64 h-full bg-[#050b18] border-l border-slate-800 flex flex-col z-20 shrink-0 select-none overflow-y-auto">
      <div className="p-3 space-y-3 flex-1 flex flex-col">
        <RouteOverview metrics={metrics} safetyColor={safetyColor} isLowRisk={isLowRisk} isModerateRisk={isModerateRisk} />
        <WhyThisRoute xaiExplanation={xaiExplanation} loading={loading} />
        <RouteComparison metrics={metrics} />
        <IcebergForecastChart icebergsPredicted={icebergsPredicted} forecastHours={forecastHours} />
        <AlertsPanel metrics={metrics} />
      </div>
    </aside>
  );
}
