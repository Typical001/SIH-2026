import React,{useEffect,useMemo,useState} from 'react';
import {MapContainer,TileLayer,Pane,GeoJSON,Polyline,CircleMarker,Popup,useMap,useMapEvents} from 'react-leaflet';
import L from 'leaflet';
import OfficialIcebergLayer from './OfficialIcebergLayer';
import {minimumWorldZoom,longitudeNear} from '../utils/mapViewport';
import WrappedGeoJSON from './WrappedGeoJSON';
const API=import.meta.env.VITE_API_URL || '';
const WORLD=[[-85.05112878,-180],[85.05112878,180]];
function WrappedPolyline({positions,...props}) {
 return [-360,0,360].map(offset=><Polyline key={offset} {...props} positions={positions.map(([lat,lon])=>[lat,lon+offset])}/>);
}
function WrappedPoint({center,...props}) {
 return [-360,0,360].map(offset=><CircleMarker key={offset} {...props} center={[center[0],center[1]+offset]}/>);
}
function Fit({points}) {
 const map=useMap();
 const fit=()=>{map.invalidateSize();if(points.length>1)map.fitBounds(points,{padding:[55,55],maxZoom:5});};
 useEffect(fit,[map,points]);
 useEffect(()=>{
  if(typeof ResizeObserver==='undefined')return;
  const observer=new ResizeObserver(()=>{
   map.invalidateSize({pan:false});
   // Keep continuous horizontal travel, but never show multiple full worlds.
   const size=map.getSize();
   map.setMinZoom(minimumWorldZoom(size.x,size.y));
  });
  observer.observe(map.getContainer());return()=>observer.disconnect();
 },[map]);
 return <div className="leaflet-bottom leaflet-right" ref={node=>{if(node){L.DomEvent.disableClickPropagation(node);L.DomEvent.disableScrollPropagation(node);}}}>
  <div className="leaflet-control flex gap-2 bg-slate-950 text-cyan-200 rounded p-2" style={{marginBottom:85}}>
   <button className="px-2 py-1" onClickCapture={()=>{map.invalidateSize();map.fitBounds(WORLD,{padding:[12,12],animate:false});}}>World view</button>
   <button className="px-2 py-1" onClickCapture={fit}>Fit route</button>
  </div>
 </div>;
}
function Click({mode,onClick}) {useMapEvents({click:e=>{if(mode==='MID_OCEAN_COORDINATES')onClick?.([e.latlng.lat,e.latlng.wrap().lng]);}});return null;}
function VectorLayer({data,label,color}) {
 const map=useMap();const [bounds,setBounds]=useState(()=>map.getBounds());
 useMapEvents({moveend:()=>setBounds(map.getBounds())});
 const renderer=useMemo(()=>L.canvas({padding:.2}),[]);
 useEffect(()=>()=>renderer.remove(),[renderer]);
 return (data?.features||[]).filter(f=>bounds.contains([f.geometry.coordinates[1],longitudeNear(f.geometry.coordinates[0],bounds.getCenter().lng)])).slice(0,100).map((f,i)=>{
 const [lon,lat]=f.geometry.coordinates,p=f.properties;
 return <CircleMarker key={i} center={[lat,longitudeNear(lon,bounds.getCenter().lng)]} radius={3} renderer={renderer} pathOptions={{color}}><Popup><strong>{label}</strong><p>{p.speed_knots ?? '—'} kn eastward</p><p>{p.source}</p></Popup></CircleMarker>;
 });
}
export default function PolarMap({waypoints=[],icebergsPresent=[],icebergsPredicted=[],forecastHours=72,safetyBufferKm=25,layerVisibility={},byuIcebergData,sarFootprintsData,seaIceLayerData,oceanCurrentsData,weatherWindData,origin,destination,originLabel,destLabel,departureMode,onMapClickCoord,paretoRoutes,activeRouteType='BALANCED',onSelectRouteType}) {
 const [base,setBase]=useState(null),[baseError,setBaseError]=useState(''),[attempt,setAttempt]=useState(0);
 const [tileError,setTileError]=useState(false);
 // Three route paths use their own SVG renderer; bulk observation layers remain on canvas.
 const routeRenderer=useMemo(()=>L.svg({pane:'route-profiles',padding:0.5}),[]);
 // Leaflet owns renderer teardown with the map. Removing it in a React effect
 // cleanup can detach live paths during StrictMode/effect refreshes.
 useEffect(()=>{const c=new AbortController();let mounted=true;setBaseError('');const timeout=setTimeout(()=>c.abort(),import.meta.env.VITE_PUBLIC_DEMO === 'true' ? 180000 : 15000);fetch(API+'/api/v1/map-base',{signal:c.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(mounted&&!c.signal.aborted){setBase(data);setBaseError('');}}).catch(()=>{if(mounted)setBaseError('Coastline could not load. Check the backend and retry.');}).finally(()=>clearTimeout(timeout));return()=>{mounted=false;clearTimeout(timeout);c.abort();};},[attempt]);
 const active=paretoRoutes?.features?.find(f=>f.properties.route_type===activeRouteType);
 const points=active?.properties?.waypoints_latlon||waypoints;
 const mapOrigin=paretoRoutes?.metadata?.origin||origin;
 const mapEnd=paretoRoutes?.metadata?.destination||destination;
 return <div className="polar-map relative w-full h-full min-h-[240px] bg-[#205777]">
 <MapContainer center={[-55,45]} zoom={3} minZoom={-2} zoomSnap={0.1} zoomDelta={0.5} maxZoom={19} worldCopyJump preferCanvas className="w-full h-full" style={{background:'#071c2d'}}>
  <Pane name="local-coastline" style={{zIndex:150}}>
   {base&&<GeoJSON pane="local-coastline" data={base} interactive={false} style={f=>({color:f.properties.kind==='shelf'?'#a5d8e8':'#7898ad',weight:1,fillColor:f.properties.kind==='shelf'?'#34556b':'#1e3548',fillOpacity:1})}/>}
  </Pane>
  <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' minZoom={-2} minNativeZoom={0} maxZoom={19} maxNativeZoom={19} keepBuffer={1} updateWhenIdle eventHandlers={{tileerror:()=>setTileError(true),tileload:()=>setTileError(false)}}/>
  <Fit points={points}/><Click mode={departureMode} onClick={onMapClickCoord}/>
  {layerVisibility.seaIce&&seaIceLayerData&&<WrappedGeoJSON key="sea-ice" data={seaIceLayerData} style={f=>({color:'#38bdf8',weight:.2,fillOpacity:f.properties.sea_ice_concentration*.4})} onEachFeature={(f,l)=>l.bindTooltip('Calculated sea ice: '+f.properties.sea_ice_percent+'% (latitude proxy, not observed)')}/>}
  {layerVisibility.bathymetry&&seaIceLayerData&&<WrappedGeoJSON key="depth-estimate" data={seaIceLayerData} style={f=>({color:'#818cf8',weight:.4,fillOpacity:.07+f.properties.sea_ice_concentration*.12})} onEachFeature={(f,l)=>l.bindTooltip('Illustrative depth estimate: '+Math.round(200+4000*(1-f.properties.sea_ice_concentration)**2)+' m. No measured bathymetry; not used for clearance.')}/>}
  {layerVisibility.sarCandidates&&sarFootprintsData&&<WrappedGeoJSON key="inspection" data={sarFootprintsData} style={{color:'#06b6d4',weight:1,fillOpacity:.1}} onEachFeature={(f,l)=>l.bindTooltip(f.properties.name+': calculated inspection box; no SAR acquisition supplied')}/>}
  {layerVisibility.refIcebergs&&(byuIcebergData?.features||[]).map(f=><WrappedPoint key={f.properties.id} center={[f.geometry.coordinates[1],f.geometry.coordinates[0]]} radius={3} pathOptions={{color:'#c084fc',weight:1}}><Popup><strong>{f.properties.id} · BYU reference</strong><p>{f.properties.observation_date}</p><p>Earlier observation; not an additional current obstacle.</p></Popup></WrappedPoint>)}
  {layerVisibility.oceanCurrents&&<VectorLayer data={oceanCurrentsData} label="Calculated ocean-current estimate" color="#60a5fa"/>}
  {layerVisibility.weatherWind&&<VectorLayer data={weatherWindData} label="Calculated wind estimate" color="#fbbf24"/>}
  <Pane name="route-profiles" style={{zIndex:450}}>
  {layerVisibility.optimizedRoutes&&[...(paretoRoutes?.features||[])].sort((a,b)=>Number(a.properties.route_type===activeRouteType)-Number(b.properties.route_type===activeRouteType)).map(f=><WrappedPolyline renderer={routeRenderer} pane="route-profiles" bubblingMouseEvents={false} key={f.properties.route_type} positions={f.properties.waypoints_latlon} pathOptions={{color:f.properties.color,weight:f.properties.route_type===activeRouteType?5:3,opacity:f.properties.route_type===activeRouteType?1:.8,dashArray:f.properties.route_type===activeRouteType?undefined:(f.properties.route_type==='FASTEST'?'3 6':'10 6')}} eventHandlers={{click:()=>onSelectRouteType?.(f.properties.route_type)}}><Popup><strong>{f.properties.route_type}</strong><p>{f.properties.objective}</p><p>{f.properties.eta_hours} h · {f.properties.ice_exposure_hours} ice-exposure hours</p><p>{f.properties.shared_corridor_with?.length?`Shares corridor with ${f.properties.shared_corridor_with.join(', ')}`:'Geometry checked against bundled obstacles.'}</p>{f.properties.feasibility_status}</Popup></WrappedPolyline>)}
  </Pane>
  {mapOrigin&&<WrappedPoint center={[mapOrigin.lat,mapOrigin.lon]} radius={6} pathOptions={{color:'#22d3ee'}}><Popup>{originLabel} · Offshore planning start</Popup></WrappedPoint>}
  {mapEnd&&<WrappedPoint center={[mapEnd.lat,mapEnd.lon]} radius={6} pathOptions={{color:'#34d399'}}><Popup>{destLabel} · Offshore planning approach</Popup></WrappedPoint>}
  <OfficialIcebergLayer present={icebergsPresent} predicted={icebergsPredicted} route={points} enabled={!!layerVisibility.predictedIcebergs} showBuffers={!!layerVisibility.riskHeatmap} forecastHours={forecastHours} safetyBufferKm={safetyBufferKm}/>
 </MapContainer>
 <div className="absolute bottom-5 left-0 z-[1000] bg-slate-950/90 text-xs text-slate-300 p-2 max-w-[70%]">{tileError?'Detailed tiles unavailable in some areas; local coastline remains available.':'Worldwide street map · Scroll to zoom; drag to explore.'}{baseError&&<> Local fallback unavailable. <button className="text-cyan-300 underline" onClick={()=>setAttempt(n=>n+1)}>Retry map</button></>}{active&&<span className="block">{active.properties.routing_algorithm||'Weighted shortest path'} · {activeRouteType} · segment checked</span>}</div>
 </div>;
}
