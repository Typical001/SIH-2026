import React, { memo, useEffect, useMemo, useState } from 'react';
import { Marker, CircleMarker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { indexIcebergs, selectIcebergs, validPoint } from '../utils/icebergVisibility';
import {longitudeNear} from '../utils/mapViewport';
import WrappedGeoJSON from './WrappedGeoJSON';

const LIMIT = 150;
const icebergIcon=L.divIcon({
 className:'official-iceberg-icon',
 iconSize:[24,24],iconAnchor:[12,12],
 html:'<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 18 6 10 10 11 14 3 19 11 22 18Z" fill="#ecfeff" stroke="#082f49" stroke-width="2" stroke-linejoin="round"/><path d="m14 3-1 13 6-5M6 10l3 8" fill="#67e8f9" stroke="#0891b2" stroke-width="1"/><path d="M2 20h20" stroke="#67e8f9" stroke-width="2" stroke-linecap="round"/></svg>'
});
const readView = map => {
  const bounds = map.getBounds();
  return { zoom: map.getZoom(), bounds: { south: bounds.getSouth(), north: bounds.getNorth(), west: bounds.getWest(), east: bounds.getEast() } };
};

function OfficialIcebergLayer({ present, predicted, route, enabled, showBuffers, forecastHours, safetyBufferKm=25 }) {
  const map = useMap();
  const [view, setView] = useState(() => readView(map));
  const [mode, setMode] = useState('all');
  const [corridorKm, setCorridorKm] = useState(50);
  const [selectedId, setSelectedId] = useState(null);
  const [trajectoryDetail, setTrajectoryDetail] = useState(null);
  useEffect(() => {
    setTrajectoryDetail(null);
    if (!selectedId) return;
    const controller = new AbortController();
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/icebergs/${encodeURIComponent(selectedId)}/trajectory?forecast_hours=${forecastHours}&safety_buffer_km=${safetyBufferKm}`, {signal:controller.signal})
      .then(r=>r.ok?r.json():null).then(data=>{if(!controller.signal.aborted)setTrajectoryDetail(data);}).catch(()=>{});
    return ()=>controller.abort();
  }, [selectedId,forecastHours,safetyBufferKm]);
  // Compact static SVG icons for the catalog; one canvas for forecast lines/rings.
  const renderer = useMemo(() => L.canvas({ padding: 0.2, tolerance: 5 }), []);
  const records = useMemo(() => indexIcebergs(present, predicted, route), [present, predicted, route]);
  const selection = useMemo(() => enabled ? selectIcebergs(records, { ...view, mode, corridorKm, limit: LIMIT }) :
    { items: [], matching: 0, limited: false }, [records, enabled, view, mode, corridorKm]);
  const selected = selection.items.find(item => item.id === selectedId);
  useMapEvents({ moveend: () => setView(readView(map)), zoomend: () => setView(readView(map)) });
  useEffect(() => {
    if (!selected) setSelectedId(null);
  }, [selected]);
  // Leaflet releases this renderer with the map; avoid effect-refresh detachment.
  const forecast = selected?.predicted;
  const viewLongitude=(view.bounds.west+view.bounds.east)/2;
  const trajectory = trajectoryDetail?.trajectory_points?.map(p => [p.lat, p.lon]).filter(validPoint).map(([lat,lon])=>[lat,longitudeNear(lon,viewLongitude)]) || [];
  const detail = selected?.present || forecast;

  return <>
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <section aria-label="Iceberg display controls" className="leaflet-control iceberg-display-control bg-slate-950/95 border border-cyan-500/40 rounded-lg p-3 text-xs text-slate-200 shadow-lg"
        ref={node => { if (node) { L.DomEvent.disableClickPropagation(node); L.DomEvent.disableScrollPropagation(node); } }}>
        <strong className="block text-cyan-200 mb-2">Official icebergs · {records.length} reported · {selection.items.length} shown</strong>
        <div className="flex gap-2 mb-2">
          <button type="button" aria-pressed={mode === 'all'} disabled={!enabled} onClickCapture={() => { setMode('all'); setSelectedId(null); }} className="iceberg-mode-button">All 33</button>
          <button type="button" aria-pressed={mode === 'route'} disabled={!enabled} onClickCapture={() => { setMode('route'); setSelectedId(null); }} className="iceberg-mode-button">Near route</button>
          <button type="button" aria-pressed={mode === 'area'} disabled={!enabled} onClickCapture={() => { setMode('area'); setSelectedId(null); }} className="iceberg-mode-button">Explore area</button>
        </div>
        <p className="mb-2"><span className="text-cyan-100">▲ Reported iceberg</span> · <span className="text-amber-300">◯ +{forecastHours}h estimate</span></p>
        <select aria-label="Focus iceberg" className="w-full bg-slate-900 rounded p-1 mb-2" disabled={!enabled} value="" onChange={e=>{
          const record=records.find(r=>r.id===e.target.value);if(!record)return;
          setMode('area');map.fitBounds(record.points,{padding:[90,90],maxZoom:8,animate:false});setView(readView(map));setSelectedId(record.id);
        }}><option value="">Locate an iceberg…</option>{records.map(r=><option key={r.id} value={r.id}>{r.id}</option>)}</select>
        <details><summary className="cursor-pointer text-slate-300">Display options</summary>
        {mode === 'route' && <label className="flex items-center gap-2 mb-2">Route corridor
          <select aria-label="Iceberg route corridor" disabled={!enabled} value={corridorKm} onChange={e => setCorridorKm(Number(e.target.value))} className="bg-slate-900 border border-slate-600 rounded px-1 py-1">
            {[25, 50, 100].map(km => <option key={km} value={km}>{km} km</option>)}
          </select>
        </label>}
        <p role="status" className="max-w-[220px] leading-relaxed">
          {!enabled ? 'Enable Official Icebergs in Map Layers.' : mode === 'all' ? 'All reported icebergs are enabled. Pan or use Locate an iceberg to inspect positions outside this view.' : mode === 'route' && route.length < 2 ? 'Calculate a route or choose Explore area.' : `${selection.items.length} of ${selection.matching} matching icebergs in view.`}
          {enabled && selection.limited && ` Display limited to ${LIMIT}; zoom in to see more.`}
        </p>
        {enabled && <p className="max-w-[220px] text-slate-400 mt-1">Click an iceberg for its forecast and buffer. Icons are location symbols, not actual iceberg size. Nearby positions can overlap; use the locator to select any of the 33.</p>}
        </details>
      </section>
    </div>
    {selection.items.map(item => {
      const rawCurrent=item.present?[item.present.lat,item.present.lon]:item.position;
      const current=[rawCurrent[0],longitudeNear(rawCurrent[1],(view.bounds.west+view.bounds.east)/2)];
      const future=item.predicted?[item.predicted.lat,item.predicted.lon]:null;
      if(future)future[1]+=360*Math.round((current[1]-future[1])/360);
      const select=e=>{L.DomEvent.stopPropagation(e.originalEvent);setSelectedId(item.id);};
      return <React.Fragment key={item.id}>
        {future&&(view.zoom>=4||item.id===selectedId)&&<>
          <Polyline positions={[current,future]} renderer={renderer} interactive={false} pathOptions={{color:'#fcd34d',weight:3,dashArray:'5 4',opacity:1}}/>
          <CircleMarker center={future} radius={10} renderer={renderer} pathOptions={{color:'#fcd34d',weight:3,fillOpacity:0}} eventHandlers={{click:select}}><Tooltip>+{forecastHours}h calculated position · {item.id}</Tooltip></CircleMarker>
        </>}
        <Marker position={current} icon={icebergIcon} title={item.id+' · reported iceberg'} alt={item.id+' iceberg'} keyboard bubblingMouseEvents={false} eventHandlers={{click:select}}>
          <Tooltip direction="left">{item.id} · reported</Tooltip>
        </Marker>
      </React.Fragment>;
    })}
    {selected && <>
      {forecast && showBuffers && trajectoryDetail?.hazard_geometry && <WrappedGeoJSON key={`${selectedId}-${forecastHours}-${safetyBufferKm}`} data={trajectoryDetail.hazard_geometry}
        style={{ color: '#f87171', fillOpacity: 0.12, weight: 1 }} />}
      {trajectory.length > 1 && <Polyline positions={trajectory} renderer={renderer} interactive={false} pathOptions={{ color: '#f87171', weight: 2, dashArray: '4 6' }} />}
      <Popup position={[selected.position[0],longitudeNear(selected.position[1],viewLongitude)]} eventHandlers={{ remove: () => setSelectedId(null) }}>
        <div className="text-xs space-y-1">
          <strong>{detail.name || selected.id}</strong>
          <p>Displayed position: {selected.position.map(n => n.toFixed(3)).join(', ')}°</p>
          <p>Source: {detail.source || 'Catalog / modeled forecast'}</p>
          {detail.last_updated_utc && <p>Report update: {detail.last_updated_utc}</p>}
          {detail.length_km && <p>Reported size: {detail.length_km.toFixed(2)} × {detail.width_km.toFixed(2)} km</p>}
          {forecast && <p>Calculated estimate, not an observed future position.</p>}
          {forecast && <p>Estimated displacement: {forecast.drift_distance_total_km?.toFixed(1)} km. Positions may overlap at this zoom; use Locate an iceberg to inspect.</p>}
          {forecast?.forecast_basis && <p>{forecast.forecast_basis}</p>}
          {forecast && <p>+{forecastHours}h forecast: {forecast.lat.toFixed(3)}, {forecast.lon.toFixed(3)}°</p>}
          {forecast && <p>Forecast envelope radius: {selected.hazardRadiusKm?.toFixed(1) ?? 'Unavailable'} km (size + buffer + uncertainty)</p>}
          {!forecast && <p>Forecast unavailable for this iceberg.</p>}
        </div>
      </Popup>
    </>}
  </>;
}

export default memo(OfficialIcebergLayer);
