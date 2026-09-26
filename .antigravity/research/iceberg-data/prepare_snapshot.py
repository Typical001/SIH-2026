"""Build the runtime snapshot from the supplied PDF; cross-check official CSV."""
import ast, csv, hashlib, json, pathlib, re
import pdfplumber

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
PDF = pathlib.Path(r'C:\Users\prath\Downloads\AntarcticIcebergs_20260924.pdf')
pattern = re.compile(r'^(\w+) (\d+) (\d+) (\d+)[°\ufffd] (\d+)\x27 ([\d.]+)" ([NS]) (\d+)[°\ufffd] (\d+)\x27 ([\d.]+)" ([EW]) ([\d.]+) (\d{2}/\d{2}/\d{4})$')
official = {r['Iceberg']:r for r in csv.DictReader((HERE/'usnic_current.csv').read_text(encoding='utf-8-sig').splitlines())}
rows=[]
with pdfplumber.open(PDF) as document:
    for page in document.pages:
        for line in page.extract_text().splitlines():
            m=pattern.match(line)
            if not m: continue
            identifier,length,width,ld,lm,ls,lh,od,om,os,oh,area,date=m.groups()
            lat=(float(ld)+float(lm)/60+float(ls)/3600)*(-1 if lh=='S' else 1)
            lon=(float(od)+float(om)/60+float(os)/3600)*(-1 if oh=='W' else 1)
            original=official[identifier]
            assert abs(lat-float(original['Latitude'])) < .006
            assert abs(lon-float(original['Longitude'])) < .006
            assert float(length)==float(original['Length (NM)']) and float(width)==float(original['Width (NM)'])
            assert float(area)==float(original['Area (sqNM)']) and date==original['Last Update']
            rows.append(dict(id=identifier,name=identifier,lat=lat,lon=lon,length_km=float(length)*1.852,width_km=float(width)*1.852,area_km2=float(original['Area (sqKM)']),last_updated_utc='2026-09-24',source='Provided USNIC report; cross-checked official CSV',thickness_m=None,mass_mt=None,orientation_deg=None))
assert len(rows)==33 and set(r['id'] for r in rows)==set(official)
digest=hashlib.sha256(PDF.read_bytes()).hexdigest()
payload=dict(dataset_id='usnic-2026-09-24-'+digest[:12],date='2026-09-24',pdf_sha256=digest,source_url='https://usicecenter.gov/Products/AntarcIcebergs',icebergs=rows)
(ROOT/'backend/data/observed_icebergs.json').write_text(json.dumps(payload,indent=2),encoding='utf-8')
# Copy existing facility definitions without importing the legacy module or seeding SQLite.
tree=ast.parse((ROOT/'backend/data_engine.py').read_text(encoding='utf-8'))
locations={}
for node in tree.body:
    if isinstance(node,ast.Assign) and isinstance(node.targets[0],ast.Name) and node.targets[0].id in ('POLAR_GATEWAYS','ANTARCTIC_STATIONS'):
        locations[node.targets[0].id]=ast.literal_eval(node.value)
(ROOT/'backend/data/locations.json').write_text(json.dumps(locations,indent=2),encoding='utf-8')
print(payload['dataset_id'],len(rows),'validated PDF rows')
