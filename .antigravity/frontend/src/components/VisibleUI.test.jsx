import React from 'react';
import {act,create} from 'react-test-renderer';
import {afterEach,expect,it,vi} from 'vitest';
import Navbar from './Navbar';
import TelemetrySidebar from './TelemetrySidebar';
import RouteComparisonModal from './RouteComparisonModal';
import PolarMap from './PolarMap';
vi.mock('./OfficialIcebergLayer',()=>({default:p=><iceberg-layer {...p}/>}));
vi.mock('leaflet',()=>({default:{CRS:{EPSG4326:{}},canvas:()=>({remove:vi.fn()}),svg:options=>({options,remove:vi.fn()})}}));
vi.mock('react-leaflet',()=>({
 MapContainer:p=><map-container {...p}/>,GeoJSON:p=><map-geojson {...p}/>,
 TileLayer:p=><map-tiles {...p}/>,Pane:p=><map-pane {...p}/>,
 Polyline:p=><map-line {...p}/>,CircleMarker:p=><map-point {...p}/>,Popup:p=><map-popup {...p}/>,
 useMap:()=>({invalidateSize:vi.fn(),fitBounds:vi.fn(),getBounds:()=>({contains:()=>true})}),useMapEvents:vi.fn()
}));
let tree;
afterEach(()=>{if(tree)act(()=>tree.unmount());vi.unstubAllGlobals();});
const content=n=>typeof n==='string'?n:(n.children||[]).map(content).join('');
const render=async element=>{await act(async()=>{tree=create(element);});};
it('reports dated sources without live claims and connects actions',async()=>{
 const exportPDF=vi.fn(),report=vi.fn(),refresh=vi.fn();
 await render(<Navbar onExportPDF={exportPDF} onOpenReport={report} onRefresh={refresh} forecastHours={72} systemHealth={{header_status_text:'USNIC 24 Sep 2026 + estimates',iceberg_count:33}}/>);
 expect(content(tree.root)).toContain('33 icebergs');
 expect(content(tree.root)).not.toMatch(/LIVE|100%|verified/i);
 for(const button of tree.root.findAllByType('button'))act(()=>button.props.onClick());
 expect(exportPDF).toHaveBeenCalledOnce();expect(report).toHaveBeenCalledOnce();expect(refresh).toHaveBeenCalledOnce();
});
it('preserves zero metrics and labels modeled outputs in reports',async()=>{
 await render(<RouteComparisonModal isOpen routeMetrics={{distance_nautical_miles:0,estimated_voyage_hours:0,fuel_consumption_tons:0,risk_score:0,geometry_validated:true,forecast_covers_voyage:false,forecast_hours:24,uncovered_voyage_hours:20}}/>);
 const text=content(tree.root);
 expect(text).toContain('0.0 t');expect(text).toContain('Passed bundled obstacle checks');
 expect(text).toContain('calculated estimates');expect(text).toContain('forecast by 20h');
 expect(text).not.toContain('Official Bridge');
});
it('does not recommend an infeasible route and sends planning inputs',async()=>{
 const fuel=vi.fn(),burn=vi.fn(),reserve=vi.fn(),toggle=vi.fn();
 await render(<TelemetrySidebar remainingFuelMt={0} onChangeRemainingFuel={fuel} onChangeReferenceBurn={burn} onChangeReservePercent={reserve} onToggleLayer={toggle} paretoRoutes={{features:[{properties:{route_type:'BALANCED',feasibility_status:'UNREACHABLE',distance_nm:100,eta_hours:10,total_fuel_burn_mt:12,reserve_mt:75}}],metadata:{recommended_route_type:null}}}/>);
 expect(content(tree.root)).toContain('No route meets fuel plus reserve requirements.');
 expect(content(tree.root)).not.toContain('· Recommended');
 for(const [label,fn,value] of [['Available fuel',fuel,25],['Reference fuel burn',burn,20],['Fuel reserve',reserve,10]]) {
  act(()=>tree.root.findByProps({'aria-label':label}).props.onChange({target:{value:String(value)}}));expect(fn).toHaveBeenLastCalledWith(value);
 }
});
it('uses returned offshore endpoints, local base map and selected profile buffer',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({type:'FeatureCollection',features:[]})})));
 const points=[[-34,18],[-60,30]];
 await render(<PolarMap origin={{lat:0,lon:0}} destination={{lat:1,lon:1}} originLabel="Cape Town" destLabel="Bharati" layerVisibility={{optimizedRoutes:true,predictedIcebergs:true,riskHeatmap:true}} safetyBufferKm={35} paretoRoutes={{metadata:{origin:{lat:-34,lon:18},destination:{lat:-60,lon:30}},features:[{properties:{route_type:'BALANCED',waypoints_latlon:points,color:'blue'}}]}}/>);
 expect(fetch).toHaveBeenCalledWith('/api/v1/map-base',expect.any(Object));
 expect(tree.root.findAllByType('map-point').map(p=>p.props.center)).toEqual(points);
 expect(tree.root.findByType('iceberg-layer').props.safetyBufferKm).toBe(35);
 expect(tree.root.findByType('map-line').props.positions).toEqual(points);
 expect(tree.root.findByType('map-container').props.maxBounds).toBeUndefined();
 expect(tree.root.findByType('map-container').props.worldCopyJump).toBe(true);
 expect(tree.root.findByType('map-tiles').props.maxZoom).toBe(19);
 expect(tree.root.findByType('map-tiles').props.minNativeZoom).toBe(0);
 expect(tree.root.findByType('map-tiles').props.attribution).toContain('OpenStreetMap');
});

it('keeps the detailed flat map as the default even when a Google key exists',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({type:'FeatureCollection',features:[]})})));
 await render(<PolarMap/>);
 expect(tree.root.findByType('map-container')).toBeTruthy();
 expect(tree.root.findAllByType('map-tiles')).toHaveLength(1);
});

it('explains shared corridors and each profile objective',async()=>{
 const route={route_type:'BALANCED',objective:'Travel hours + 4 × ice-exposure hours',eta_hours:60,ice_exposure_hours:8,commanded_speed_knots:14.5,shared_corridor_with:['FASTEST'],feasibility_status:'FEASIBLE'};
 await render(<TelemetrySidebar paretoRoutes={{features:[{properties:route}],metadata:{recommended_route_type:'BALANCED',comparison_note:'All profiles use the same speed, vessel and safety buffer.',overlap_tolerance_km:10,profile_overlap:[{profiles:['BALANCED','FASTEST'],overlap_percent:100}]}}}/>);
 expect(content(tree.root)).toContain(route.objective);
 expect(content(tree.root)).toContain('Shares corridor with FASTEST');
 expect(content(tree.root)).toContain('100% shared corridor (within 10 km)');
 expect(content(tree.root)).toContain('8 ice-exposure hours · 14.5 kn requested');
});

it('recovers the coastline after a failed request through Retry map',async()=>{
 const request=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ok:true,json:async()=>({type:'FeatureCollection',features:[]})});
 vi.stubGlobal('fetch',request);
 await render(<PolarMap/>);
 expect(content(tree.root)).toContain('Local fallback unavailable');
 const retry=tree.root.findAllByType('button').find(button=>content(button)==='Retry map');
 await act(async()=>retry.props.onClick());
 expect(request).toHaveBeenCalledTimes(2);
 expect(content(tree.root)).not.toContain('Local fallback unavailable');
 expect(tree.root.findAllByType('map-geojson')).toHaveLength(1);
});
