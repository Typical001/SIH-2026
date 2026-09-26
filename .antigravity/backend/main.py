"""Local observation-backed planning API. No outbound providers or seeded AIS."""
import hashlib
import json
from pathlib import Path
from typing import Literal
from threading import Lock
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ConfigDict, model_validator
from observed_data import DATASET_ID, SNAPSHOT, LOCATIONS, forecast, iceberg_response, layer_data
from observed_routes import calculate, APPROACH_CHAINS, NoRouteFoundError, hazard_geometry, profile_graph, PROFILES, ROUTING_MODEL
from shapely.geometry import mapping
from observed_data import vessel_class

@asynccontextmanager
async def lifespan(app):
    for profile in PROFILES: profile_graph(72,25,profile,'PC3')
    yield

app=FastAPI(title='PolarNav observation-backed planning demo',version='2.0.0',lifespan=lifespan)
app.add_middleware(GZipMiddleware,minimum_size=1000)
app.add_middleware(CORSMiddleware,allow_origins=['http://localhost:3000','http://127.0.0.1:3000'],allow_methods=['GET','POST'],allow_headers=['*'])

class CalculateRouteRequest(BaseModel):
    model_config=ConfigDict(allow_inf_nan=False,extra='forbid')
    forecast_hours:int=Field(72,ge=0,le=72)
    safety_buffer_km:float=Field(25,ge=5,le=100)
    origin_type:Literal['GATEWAY','CURRENT_SHIP_GPS','MID_OCEAN_COORDINATES']='GATEWAY'
    origin_coords:list[float]|None=Field(None,min_length=2,max_length=2)
    gateway_code:str='ZACPT'
    destination_station_id:str='bharati_station'
    vessel_imo:int=9577133
    remaining_fuel_mt:float=Field(450,ge=0,le=5000)
    max_tank_capacity_mt:float=Field(500,ge=10,le=5000)
    fuel_tank_percentage:float|None=Field(None,ge=0,le=100)
    start_lat:float|None=Field(None,ge=-85,le=85)
    start_lon:float|None=Field(None,ge=-180,le=180)
    end_lat:float|None=Field(None,ge=-85,le=85)
    end_lon:float|None=Field(None,ge=-180,le=180)
    vessel_ice_class:str='Polar Class 3 (PC3)'
    cruising_speed_knots:float=Field(14.5,ge=5,le=30)
    grid_resolution_deg:float=Field(.8,ge=.4,le=2)
    reference_burn_mt_day:float=Field(12,gt=0,le=300)
    reserve_percent:float=Field(15,ge=0,le=50)
    @model_validator(mode='after')
    def validate_inputs(self):
        vessel_class(self.vessel_ice_class)
        if self.gateway_code not in LOCATIONS['POLAR_GATEWAYS']: raise ValueError('Unknown gateway')
        if self.destination_station_id not in LOCATIONS['ANTARCTIC_STATIONS']: raise ValueError('Unknown station')
        if (self.start_lat is None)!=(self.start_lon is None) or (self.end_lat is None)!=(self.end_lon is None): raise ValueError('Coordinates require latitude and longitude')
        if self.origin_coords and not (-85<=self.origin_coords[0]<=85 and -180<=self.origin_coords[1]<=180): raise ValueError('Coordinates out of range')
        if self.fuel_tank_percentage is None and self.remaining_fuel_mt>self.max_tank_capacity_mt: raise ValueError('Fuel exceeds tank capacity')
        return self

@app.get('/api/health')
def health_check():
    return dict(status='healthy',mode='OBSERVATIONS_WITH_ESTIMATES',dataset_id=DATASET_ID,is_live_satellite=False,
                iceberg_count=33,header_status_text='USNIC 24 Sep 2026 + estimates',version='2.0.0')

@app.get('/api/v1/icebergs')
def get_icebergs(forecast_hours:int=Query(72,ge=0,le=72),safety_buffer_km:float=Query(25,ge=5,le=100)):
    return iceberg_response(forecast_hours,safety_buffer_km)

@app.get('/api/v1/icebergs/{identifier}/trajectory')
def trajectory(identifier:str,forecast_hours:int=Query(72,ge=0,le=72),safety_buffer_km:float=Query(25,ge=5,le=100)):
    result=next((f for f in forecast(forecast_hours,safety_buffer_km) if f['id']==identifier),None)
    if not result: raise HTTPException(404,'Unknown iceberg')
    return dict(dataset_id=DATASET_ID,**result,hazard_geometry=mapping(hazard_geometry(result)))

@app.get('/api/v1/layers/status')
def layer_status():
    return dict(status='success',overall_sync_label='Observations + estimates',all_live=False,any_live=False,dataset_id=DATASET_ID)

@app.get('/api/v1/layers/{name}')
def layers(name:str):
    if name not in ('byu-icebergs','usnic-icebergs','sar-candidates','sea-ice','ocean-currents','weather-wind'): raise HTTPException(404,'Unknown layer')
    return dict(status='success',dataset_id=DATASET_ID,is_live=False,geojson=layer_data(name))

@app.get('/api/v1/icebergs/live')
def legacy_icebergs():
    return dict(mode='DATED_SNAPSHOT',is_live=False,dataset_id=DATASET_ID,geojson=layer_data('usnic-icebergs'))

@app.get('/api/v1/stations')
def stations():
    return dict(status='success',stations=LOCATIONS,approaches={k:v[0] for k,v in APPROACH_CHAINS.items()})

@app.get('/api/v1/metocean')
def metocean(): return dict(status='success',source='Calculated planning estimate',geojson=layer_data('sea-ice'))

@app.get('/api/v1/map-base')
def map_base():
    return FileResponse(Path(__file__).parent/'data/map_base.geojson',media_type='application/geo+json')

FIX_PATH=Path(__file__).parent/'data/user_vessel_fixes.json'
FIX_LOCK=Lock()
class VesselFix(BaseModel):
    model_config=ConfigDict(allow_inf_nan=False)
    vessel_imo:int=9577133
    lat:float=Field(ge=-85,le=85)
    lon:float=Field(ge=-180,le=180)

@app.get('/api/v1/vessel/last-fix')
def vessel_fix(vessel_imo:int=9577133):
    with FIX_LOCK:
        fixes=json.loads(FIX_PATH.read_text()) if FIX_PATH.exists() else {}
    fix=fixes.get(str(vessel_imo))
    if fix is None: fix=dict(lat=-64.5,lon=72,source='Assumed planning waypoint; no AIS feed',is_observed=False)
    return dict(status='success',fix=dict(vessel_imo=vessel_imo,**fix))

@app.post('/api/v1/vessel/update-fix')
def update_fix(fix:VesselFix):
    with FIX_LOCK:
        fixes=json.loads(FIX_PATH.read_text()) if FIX_PATH.exists() else {}
        fixes[str(fix.vessel_imo)]=dict(lat=fix.lat,lon=fix.lon,source='User-entered waypoint',is_observed=False)
        temp=FIX_PATH.with_suffix('.tmp'); temp.write_text(json.dumps(fixes)); temp.replace(FIX_PATH)
    return dict(status='success',fix=fixes[str(fix.vessel_imo)])

@app.post('/api/v1/calculate-route')
def post_calculate_route(request:CalculateRouteRequest):
    if request.start_lat is not None: start=(request.start_lat,request.start_lon)
    elif request.origin_type=='GATEWAY': start=tuple(APPROACH_CHAINS[request.gateway_code][0])
    elif request.origin_coords: start=tuple(request.origin_coords)
    else:
        fix=vessel_fix(request.vessel_imo)['fix']; start=(fix['lat'],fix['lon'])
    end=(request.end_lat,request.end_lon) if request.end_lat is not None else tuple(APPROACH_CHAINS[request.destination_station_id][0])
    fuel=request.remaining_fuel_mt if request.fuel_tank_percentage is None else request.fuel_tank_percentage*request.max_tank_capacity_mt/100
    try:
        response=calculate(start,end,request.vessel_ice_class,request.cruising_speed_knots,fuel,request.max_tank_capacity_mt,
                           request.forecast_hours,request.safety_buffer_km,request.reference_burn_mt_day,request.reserve_percent)
    except NoRouteFoundError as exc:
        raise HTTPException(409,detail=dict(code='NO_ROUTE_FOUND',message='No safe route available. '+str(exc))) from exc
    except (OSError,ValueError) as exc:
        raise HTTPException(503,detail=dict(code='DATA_UNAVAILABLE',message='Required planning data could not be validated.')) from exc
    inputs=request.model_dump()
    identity=dict(inputs=inputs,dataset_id=DATASET_ID,routing_model=ROUTING_MODEL)
    response['metadata'].update(inputs=inputs,request_id=hashlib.sha256(json.dumps(identity,sort_keys=True).encode()).hexdigest()[:16])
    return response

@app.get('/api/v1/pareto-routes')
@app.get('/api/v1/polar-route')
def legacy_route(start_lat:float=-34,start_lon:float=18,end_lat:float=-69.2,end_lon:float=76.2,
                 forecast_hours:int=72,safety_buffer_km:float=25,vessel_ice_class:str='PC3',cruising_speed_knots:float=14.5,
                 remaining_fuel_mt:float=450,max_tank_capacity_mt:float=500,fuel_tank_percentage:float|None=None):
    try: request=CalculateRouteRequest(start_lat=start_lat,start_lon=start_lon,end_lat=end_lat,end_lon=end_lon,forecast_hours=forecast_hours,safety_buffer_km=safety_buffer_km,vessel_ice_class=vessel_ice_class,cruising_speed_knots=cruising_speed_knots,remaining_fuel_mt=remaining_fuel_mt,max_tank_capacity_mt=max_tank_capacity_mt,fuel_tank_percentage=fuel_tank_percentage)
    except ValueError as exc: raise HTTPException(422,'Invalid routing inputs') from exc
    return post_calculate_route(request)

if __name__=='__main__':
    import uvicorn
    uvicorn.run('main:app',host='127.0.0.1',port=8000)
