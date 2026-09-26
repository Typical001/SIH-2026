"""Normalize snapshots, inventory historical rows, and inspect shelf polygons."""
import collections, csv, datetime as dt, io, json, pathlib, re, zipfile
import shapefile
from pyproj import CRS

ROOT = pathlib.Path(__file__).resolve().parent
def save(name, data):
    (ROOT / name).write_text(json.dumps(data, indent=2, allow_nan=False), encoding='utf-8')
def points(name, rows):
    assert len({r['id'] for r in rows}) == len(rows)
    assert all(-90 <= r['latitude'] <= 90 and -180 <= r['longitude'] <= 180 for r in rows)
    save(name, {'type':'FeatureCollection', 'features':[{'type':'Feature','geometry':{'type':'Point','coordinates':[r['longitude'],r['latitude']]},'properties':r} for r in rows]})

official=[]
for r in csv.DictReader((ROOT/'usnic_current.csv').read_text(encoding='utf-8-sig').splitlines()):
    official.append(dict(id=r['Iceberg'], latitude=float(r['Latitude']), longitude=float(r['Longitude']), length_km=round(float(r['Length (NM)'])*1.852,6), width_km=round(float(r['Width (NM)'])*1.852,6), area_km2=float(r['Area (sqKM)']), last_update=dt.datetime.strptime(r['Last Update'],'%m/%d/%Y').date().isoformat(), source='USNIC CSV', observed_at=None, thickness_m=None, mass_mt=None, orientation_deg=None))
points('usnic_snapshot.geojson', official)

byu=[]
html=(ROOT/'byu_current.html').read_text()
revision=re.search(r'Last revised:\s*([\d:]+)\s+(\d{2}/\d{2}/\d{2})',html)
assert revision, 'Missing revision date'
year=dt.datetime.strptime(revision[2],'%m/%d/%y').year
for row in re.findall(r'<tr>(.*?)</tr>', html, re.S|re.I):
    cells=re.findall(r'<td[^>]*>(.*?)</td>',row,re.S|re.I)
    if len(cells)!=4 or not re.fullmatch(r'[a-z]+\d+[a-z]*',cells[0].strip()): continue
    def dm(value):
        m=re.fullmatch(r"\s*(\d+)\s+(\d+)'([NSEW])\s*",value)
        assert m
        return (int(m[1])+int(m[2])/60)*(-1 if m[3] in 'SW' else 1)
    day=int(cells[3]); date=dt.date(year,1,1)+dt.timedelta(days=day-1)
    byu.append(dict(id=cells[0].upper(),longitude=dm(cells[1]),latitude=dm(cells[2]), observation_day_of_year=day, observation_date=date.isoformat(), observation_year_basis='Inferred from page revision '+revision[2], source='BYU ASCAT/OSCAT-2',length_km=None,width_km=None))
points('byu_snapshot.geojson', byu)

inventory=[]
(ROOT/'historical_csv').mkdir(exist_ok=True)
with zipfile.ZipFile(ROOT/'byu_history_v8.zip') as z:
    for name in z.namelist():
        if not name.endswith('.csv'): continue
        content=z.read(name); rows=list(csv.DictReader(io.StringIO(content.decode('utf-8-sig'))))
        def parse_date(value):
            value=value.strip()
            if len(value)==5:
                yr=int(value[:2]); year=1900+yr if yr>=78 else 2000+yr
                value=str(year)+value[2:]
            return dt.datetime.strptime(value,'%Y%j').date().isoformat()
        dates=[parse_date(r['date']) for r in rows]
        target=ROOT/'historical_csv'/pathlib.PurePosixPath(name).name
        assert not target.exists() or target.read_bytes()==content, 'Existing extracted file differs; preserve it'
        target.write_bytes(content)
        inventory.append(dict(id=target.stem.upper(),file='historical_csv/'+target.name,rows=len(rows),first_date=min(dates) if dates else None,last_date=max(dates) if dates else None,columns=list(rows[0]) if rows else []))
save('historical_inventory.json',inventory)

with zipfile.ZipFile(ROOT/'usnic_shelf_2022.zip') as z:
    base='USNIC_ANTARC_shelf_2022'
    reader=shapefile.Reader(shp=io.BytesIO(z.read(base+'.shp')),shx=io.BytesIO(z.read(base+'.shx')),dbf=io.BytesIO(z.read(base+'.dbf')))
    counts=collections.Counter(r.as_dict()['POLY_TYPE'] for r in reader.records())
    wkt=z.read(base+'.prj').decode()
    shelf=dict(features=len(reader), polygon_types=dict(counts), crs_wkt=wkt, crs_name=CRS.from_wkt(wkt).name, source_vintage=2022, coordinates='Original projected coordinates; reprojection and topology checks required before web-map use')
save('shelf_inventory.json',shelf)
ids1={r['id'] for r in official};ids2={r['id'] for r in byu}
summary=dict(usnic_records=len(official),byu_records=len(byu),unique_snapshot_ids=len(ids1|ids2),shared_ids=len(ids1&ids2),byu_only=sorted(ids2-ids1),usnic_only=sorted(ids1-ids2),historical_tracks=len(inventory),historical_rows=sum(r['rows'] for r in inventory),historical_first_date=min(r['first_date'] for r in inventory if r['first_date']),historical_last_date=max(r['last_date'] for r in inventory if r['last_date']),shelf=shelf,largest_by_reported_area=sorted(official,key=lambda r:r['area_km2'],reverse=True)[:5])
save('summary.json',summary)
print(json.dumps(summary,indent=2))
