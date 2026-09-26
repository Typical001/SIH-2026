import React from 'react';
const LAYERS=[
 ['predictedIcebergs','Official icebergs','USNIC 24 Sep 2026 + estimated drift'],
 ['riskHeatmap','Selected iceberg buffer','Same envelope used for routing'],
 ['refIcebergs','Reference icebergs','BYU earlier dated observations; reference only'],
 ['seaIce','Sea ice concentration','Calculated latitude-based estimate'],
 ['oceanCurrents','Ocean currents','Calculated eastward-current estimate'],
 ['weatherWind','Wind vectors','Calculated latitude-based estimate'],
 ['sarCandidates','SAR inspection candidates','Derived search boxes; no satellite acquisition'],
 ['bathymetry','Bathymetry estimate','Illustrative depth proxy; not measured'],
 ['optimizedRoutes','Route profiles','Geometry checked against bundled obstacles'],
];
export default function TelemetrySidebar({routeMetrics,vesselIceClass,loading,paretoRoutes,activeRouteType,remainingFuelMt=450,onChangeRemainingFuel,maxTankCapacityMt=500,onSelectRouteType,onExportPDF,onOpenReport,layerVisibility={},onToggleLayer,referenceBurn=12,onChangeReferenceBurn,reservePercent=15,onChangeReservePercent}) {
 const recommendation=paretoRoutes?.metadata?.recommended_route_type;
 return <aside className="w-80 max-w-[42vw] shrink-0 overflow-y-auto bg-slate-950 border-r border-slate-700 text-slate-200 p-3 space-y-4 text-xs">
 <h2 className="font-bold">Planning inputs & results</h2>
 <label className="block">Available fuel: {remainingFuelMt} / {maxTankCapacityMt} t<input aria-label="Available fuel" type="range" min="0" max={maxTankCapacityMt} step="5" value={remainingFuelMt} onChange={e=>onChangeRemainingFuel(Number(e.target.value))} className="w-full"/></label>
 <label className="block">Reference burn (t/day at 12 kn)<input aria-label="Reference fuel burn" type="number" min="1" max="300" value={referenceBurn} onChange={e=>onChangeReferenceBurn?.(Math.max(1,Math.min(300,Number(e.target.value))))} className="w-full bg-slate-800 p-1"/></label>
 <label className="block">Reserve (% of tank)<input aria-label="Fuel reserve" type="number" min="0" max="50" value={reservePercent} onChange={e=>onChangeReservePercent?.(Math.max(0,Math.min(50,Number(e.target.value))))} className="w-full bg-slate-800 p-1"/></label>
 <p className="text-xs text-amber-200">Fuel burn and vessel limits are planning assumptions, not measured vessel specifications.</p>
 <div className="space-y-2" aria-label="Route choices">{['SAFEST','BALANCED','FASTEST'].map(type=>{
  const p=paretoRoutes?.features?.find(f=>f.properties.route_type===type)?.properties;
  return <button key={type} disabled={!p||loading} onClick={()=>onSelectRouteType(type)} className={'w-full text-left rounded p-3 border '+(type===activeRouteType?'border-cyan-400 bg-cyan-950':'border-slate-700')}>
   <strong>{type} {recommendation===type?'· Recommended':''}</strong>
   {p?.objective&&<p className="text-xs text-slate-300 mt-1">{p.objective}</p>}
   {!p?<p className="text-xs">Unavailable</p>:<><p>{p.distance_nm} NM · {p.eta_hours} h</p><p>{p.total_fuel_burn_mt} t burn · {p.reserve_mt} t reserve</p><p className={p.feasibility_status==='FEASIBLE'?'text-emerald-300':'text-amber-300'}>{p.feasibility_status==='FEASIBLE'?'Fuel feasible':'Insufficient fuel including reserve'}</p></>}
   {Number.isFinite(p?.ice_exposure_hours)&&<p>{p.ice_exposure_hours} ice-exposure hours · {p.commanded_speed_knots} kn requested</p>}
   {!!p?.shared_corridor_with?.length&&<p className="text-amber-200">Shares corridor with {p.shared_corridor_with.join(', ')}.</p>}
  </button>;
 })}</div>
 {paretoRoutes?.metadata?.comparison_note&&<div className="space-y-1 text-slate-300" aria-label="Route comparison">
  <p>{paretoRoutes.metadata.comparison_note}</p>
  <p>Ice-exposure hours = travel time × estimated ice concentration. Lower means less cumulative exposure, not a safety guarantee.</p>
  {(paretoRoutes.metadata.profile_overlap||[]).map(pair=><p key={pair.profiles.join('-')}>{pair.profiles.join(' / ')}: {pair.overlap_percent}% shared corridor (within {paretoRoutes.metadata.overlap_tolerance_km} km).</p>)}
 </div>}
 {paretoRoutes && !recommendation && <p role="status" className="text-amber-300">No route meets fuel plus reserve requirements.</p>}
 {routeMetrics && <div className="space-y-1 border-t border-slate-700 pt-3">
 <p>Estimated ice exposure: {routeMetrics.risk_score}/100</p><p>Max estimated sea ice: {routeMetrics.max_sea_ice_concentration_pct}%</p>
 <p>Selected buffer: {routeMetrics.iceberg_hazard_buffer_km} km + size + uncertainty</p>
 <p>Vessel: {vesselIceClass}</p>
 {routeMetrics.forecast_covers_voyage===false && <p className="text-amber-300 text-xs">Voyage extends {routeMetrics.uncovered_voyage_hours} h beyond the forecast. Later conditions are unknown.</p>}
 </div>}
 <div><h3 className="font-bold mb-2">Map layers</h3>{LAYERS.map(([key,title,source])=><label key={key} className="block py-1"><input type="checkbox" checked={!!layerVisibility[key]} onChange={()=>onToggleLayer(key)}/> {title}<small className="block ml-4 text-slate-400">{source}</small></label>)}</div>
 <button disabled={!routeMetrics||loading} onClick={onExportPDF} className="border rounded px-3 py-2">Export report</button>
 <button onClick={onOpenReport} className="ml-2 border rounded px-3 py-2">Analytics</button>
 </aside>;
}
