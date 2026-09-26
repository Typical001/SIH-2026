import React, { memo, useEffect, useMemo, useState } from 'react';
import { GeoJSON, CircleMarker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { indexIcebergs, selectIcebergs, validPoint } from '../utils/icebergVisibility';

const LIMIT = 150;
const readView = map => {
  const bounds = map.getBounds();
  return { zoom: map.getZoom(), bounds: { south: bounds.getSouth(), north: bounds.getNorth(), west: bounds.getWest(), east: bounds.getEast() } };
};

function OfficialIcebergLayer({ present, predicted, route, enabled, showBuffers, forecastHours, safetyBufferKm=25 }) {
  const map = useMap();
  const [view, setView] = useState(() => readView(map));
  const [mode, setMode] = useState('route');
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
  // One canvas shared by the layer, no animated DOM marker for each iceberg.
  const renderer = useMemo(() => L.canvas({ padding: 0.2, tolerance: 5 }), []);
  const records = useMemo(() => indexIcebergs(present, predicted, route), [present, predicted, route]);
  const selection = useMemo(() => enabled ? selectIcebergs(records, { ...view, mode, corridorKm, limit: LIMIT }) :
    { items: [], matching: 0, limited: false }, [records, enabled, view, mode, corridorKm]);
  const selected = selection.items.find(item => item.id === selectedId);
  useMapEvents({ moveend: () => setView(readView(map)), zoomend: () => setView(readView(map)) });
  useEffect(() => {
    if (!selected) setSelectedId(null);
  }, [selected]);
  useEffect(() => () => renderer.remove(), [renderer]);
  const forecast = selected?.predicted;
  const trajectory = trajectoryDetail?.trajectory_points?.map(p => [p.lat, p.lon]).filter(validPoint) || [];
  const detail = selected?.present || forecast;

  return <>
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <section aria-label="Iceberg display controls" className="leaflet-control iceberg-display-control bg-slate-950/95 border border-cyan-500/40 rounded-lg p-3 text-xs text-slate-200 shadow-lg"
        ref={node => { if (node) { L.DomEvent.disableClickPropagation(node); L.DomEvent.disableScrollPropagation(node); } }}>
        <strong className="block text-cyan-200 mb-2">Official icebergs · {selection.items.length} visible</strong>
        <div className="flex gap-2 mb-2">
          <button type="button" aria-pressed={mode === 'route'} disabled={!enabled} onClickCapture={() => { setMode('route'); setSelectedId(null); }} className="iceberg-mode-button">Near route</button>
          <button type="button" aria-pressed={mode === 'area'} disabled={!enabled} onClickCapture={() => { setMode('area'); setSelectedId(null); }} className="iceberg-mode-button">Explore area</button>
        </div>
        <p className="mb-2"><span className="text-cyan-100">● Reported</span> · <span className="text-amber-300">◯ +{forecastHours}h estimate</span></p>
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
          {!enabled ? 'Enable Official Icebergs in Map Layers.' : mode === 'route' && route.length < 2 ? 'Calculate a route or choose Explore area.' : `${selection.items.length} of ${selection.matching} matching icebergs in view.`}
          {enabled && selection.limited && ` Display limited to ${LIMIT}; zoom in to see more.`}
        </p>
        {enabled && <p className="max-w-[220px] text-slate-400 mt-1">{mode === 'area' ? 'Pan and zoom to inspect a location. ' : 'Current and forecast positions near the selected route. '}Click a dot for its forecast and buffer. Display filter only.</p>}
        </details>
      </section>
    </div>
    {selection.items.map(item => {
      const current=item.present?[item.present.lat,item.present.lon]:item.position;
      const future=item.predicted?[item.predicted.lat,item.predicted.lon]:null;
      if(future)future[1]+=360*Math.round((current[1]-future[1])/360);
      const select=e=>{L.DomEvent.stopPropagation(e.originalEvent);setSelectedId(item.id);};
      return <React.Fragment key={item.id}>
        {future&&<>
          <Polyline positions={[current,future]} renderer={renderer} interactive={false} pathOptions={{color:'#fcd34d',weight:3,dashArray:'5 4',opacity:1}}/>
          <CircleMarker center={future} radius={10} renderer={renderer} pathOptions={{color:'#fcd34d',weight:3,fillOpacity:0}} eventHandlers={{click:select}}><Tooltip>+{forecastHours}h calculated position · {item.id}</Tooltip></CircleMarker>
        </>}
        <CircleMarker center={current} renderer={renderer} radius={item.id===selectedId?8:6}
          pathOptions={{color:'#083344',weight:2,fillColor:'#ecfeff',fillOpacity:1}} eventHandlers={{click:select}}>
          <Tooltip permanent={view.zoom>=5} direction="left">{item.id} · reported</Tooltip>
        </CircleMarker>
      </React.Fragment>;
    })}
    {selected && <>
      {forecast && showBuffers && trajectoryDetail?.hazard_geometry && <GeoJSON key={`${selectedId}-${forecastHours}-${safetyBufferKm}`} data={trajectoryDetail.hazard_geometry}
        style={{ color: '#f87171', fillOpacity: 0.12, weight: 1 }} />}
      {trajectory.length > 1 && <Polyline positions={trajectory} renderer={renderer} interactive={false} pathOptions={{ color: '#f87171', weight: 2, dashArray: '4 6' }} />}
      <Popup position={selected.position} eventHandlers={{ remove: () => setSelectedId(null) }}>
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
