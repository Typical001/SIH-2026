"""Dated observations and explicitly labelled planning estimates. No network or DB."""
import datetime as dt
import json
import math
from functools import lru_cache
from pathlib import Path
import pyproj

ROOT = Path(__file__).parent
RESEARCH = ROOT.parent / 'research/iceberg-data'
SNAPSHOT = json.loads((ROOT/'data/observed_icebergs.json').read_text())
LOCATIONS = json.loads((ROOT/'data/locations.json').read_text())
BYU = json.loads((RESEARCH/'byu_snapshot.geojson').read_text())
DATASET_ID = SNAPSHOT['dataset_id'] + '-model-v1'
GEOD = pyproj.Geod(ellps='WGS84')
CLASS_LIMITS = {'PC1':1.0, 'PC3':.90, 'PC5':.75, 'PC7':.40, 'OPEN':.05}

def vessel_class(value):
    for code in CLASS_LIMITS:
        if code in value.upper(): return code
    if value == 'Open Water Vessel': return 'OPEN'
    raise ValueError('Unsupported vessel class')

def environment(lat, lon):
    # Transparent latitude-based planning proxies, never satellite observations.
    sic = max(0, min(.95, (-lat-60)/20))
    jet = math.exp(-((lat+52)/9)**2)
    return dict(sea_ice_concentration=sic, sea_ice_percent=round(100*sic,1),
                current_knots=round(.5*jet,3), wind_knots=round(10+15*jet,2),
                direction_deg=90, source='Calculated latitude-based planning estimate', is_observed=False)

@lru_cache(maxsize=256)
def motion(identifier):
    current = next(r for r in SNAPSHOT['icebergs'] if r['id']==identifier)
    old = next((f['properties'] for f in BYU['features'] if f['properties']['id']==identifier),None)
    if old:
        hours=(dt.date.fromisoformat(SNAPSHOT['date'])-dt.date.fromisoformat(old['observation_date'])).days*24
        bearing,_,metres=GEOD.inv(old['longitude'],old['latitude'],current['lon'],current['lat'])
        if hours > 0:
            return bearing, min(2.0, metres/1000/hours), 'Two-source displacement; report update date used as observation-time proxy; speed capped at 2 km/h'
    return 90, .03, 'No earlier matching position; assumed eastward drift 0.03 km/h'

@lru_cache(maxsize=48)
def forecast(hours=72, buffer=25.0):
    rows=[]
    for ib in SNAPSHOT['icebergs']:
        bearing,speed,basis=motion(ib['id'])
        times=sorted(set([0,hours]+list(range(6,hours,6))))
        points=[]
        for hour in times:
            lon,lat,_=GEOD.fwd(ib['lon'],ib['lat'],bearing,speed*hour*1000)
            points.append(dict(lat=lat,lon=lon,hour=hour))
        # Half diagonal encloses the unknown orientation; uncertainty grows with horizon.
        size=math.hypot(ib['length_km'],ib['width_km'])/2
        radius=size+buffer+.25*hours
        rows.append(dict(id=ib['id'],name=ib['name'],lat=points[-1]['lat'],lon=points[-1]['lon'],
                         initial_lat=ib['lat'],initial_lon=ib['lon'],safety_radius_km=radius,
                         planning_hazard_radius_km=radius,trajectory_points=points,
                         drift_distance_total_km=round(speed*hours,3),forecast_basis=basis,
                         physical_radius_km=size,uncertainty_km=.25*hours,source='Calculated estimate from '+SNAPSHOT['date']))
    return rows

def iceberg_response(hours=72, buffer=25.0, details=False):
    forecasts=forecast(hours,buffer)
    return dict(status='success',mode='OBSERVATIONS_WITH_ESTIMATES',dataset_id=DATASET_ID,
                source='USNIC report 2026-09-24 + calculated estimates',observation_date=SNAPSHOT['date'],
                forecast_hours=hours,total_icebergs=len(SNAPSHOT['icebergs']),icebergs_present=SNAPSHOT['icebergs'],
                icebergs_predicted_72h=[{k:v for k,v in f.items() if details or k!='trajectory_points'} for f in forecasts],
                detailed_forecasts=[])

def feature_collection(features):
    return {'type':'FeatureCollection','features':features}

def layer_data(name, hours=72):
    if name=='byu-icebergs':
        return BYU
    if name=='usnic-icebergs':
        return feature_collection([dict(type='Feature',geometry=dict(type='Point',coordinates=[r['lon'],r['lat']]),properties=r) for r in SNAPSHOT['icebergs']])
    if name=='sar-candidates':
        # Candidate inspection boxes around observed positions, not invented satellite detections.
        return feature_collection([dict(type='Feature',geometry=dict(type='Polygon',coordinates=[[[r['lon']-.15,r['lat']-.05],[r['lon']+.15,r['lat']-.05],[r['lon']+.15,r['lat']+.05],[r['lon']-.15,r['lat']+.05],[r['lon']-.15,r['lat']-.05]]]),properties=dict(name=r['id'],source='Calculated inspection box around reported iceberg; no SAR acquisition supplied',sensor='Not available',content_date=SNAPSHOT['date'])) for r in SNAPSHOT['icebergs']])
    features=[]
    for lat in range(-78,-33,4):
        for lon in range(-180,180,15):
            env=environment(lat,lon)
            p=dict(env,latitude=lat,longitude=lon)
            geometry=dict(type='Point',coordinates=[lon,lat])
            if name=='sea-ice':
                geometry=dict(type='Polygon',coordinates=[[[lon,lat],[lon+15,lat],[lon+15,lat+4],[lon,lat+4],[lon,lat]]])
            else:
                speed=env['wind_knots'] if name=='weather-wind' else env['current_knots']
                p.update(speed_knots=speed,speed_mps=round(speed*.514444,3),u_current=speed*.514444,v_current=0,u_wind=speed*.514444,v_wind=0)
            features.append(dict(type='Feature',geometry=geometry,properties=p))
    return feature_collection(features)
