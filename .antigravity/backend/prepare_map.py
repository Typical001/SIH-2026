"""Create a compact local display map; route checks retain full source geometry."""
import io,json,zipfile
from pathlib import Path
import shapefile,pyproj
from shapely.geometry import shape,mapping,Polygon,box
from shapely.ops import transform
from shapely.validation import make_valid
from shapely.affinity import translate

ROOT=Path(__file__).parent
features=[]
def polygon_only(geom):
    from shapely.geometry import MultiPolygon
    def parts(g):
        if g.geom_type=='Polygon': return [g]
        if hasattr(g,'geoms'): return [p for child in g.geoms for p in parts(child)]
        return []
    return MultiPolygon(parts(geom))
with shapefile.Reader(str(ROOT/'data/ne_10m_land.zip')) as reader:
    for s in reader.iterShapes():
        g=polygon_only(make_valid(shape(s.__geo_interface__))).simplify(.06,preserve_topology=True)
        features.append(dict(type='Feature',geometry=mapping(g),properties=dict(kind='land',source='Natural Earth 1:10m; display simplified')))
with zipfile.ZipFile(ROOT.parent/'research/iceberg-data/usnic_shelf_2022.zip') as z:
    base='USNIC_ANTARC_shelf_2022'
    crs=pyproj.CRS.from_wkt(z.read(base+'.prj').decode())
    transformer=pyproj.Transformer.from_crs(crs,'EPSG:4326',always_xy=True)
    reader=shapefile.Reader(shp=io.BytesIO(z.read(base+'.shp')),dbf=io.BytesIO(z.read(base+'.dbf')),shx=io.BytesIO(z.read(base+'.shx')))
    for r in reader.iterShapeRecords():
        if r.record.as_dict()['POLY_TYPE']!='S': continue
        geom=transform(transformer.transform,make_valid(shape(r.shape.__geo_interface__)))
        for polygon in geom.geoms if hasattr(geom,'geoms') else [geom]:
            def unwrap(ring):
                out=[]
                for x,y in ring.coords:
                    if out: x=out[-1][0]+(x-out[-1][0]+180)%360-180
                    out.append((x,y))
                return out
            g=make_valid(Polygon(unwrap(polygon.exterior),[unwrap(ring) for ring in polygon.interiors])).simplify(.015,preserve_topology=True)
            for offset in (-360,0,360):
                clipped=polygon_only(translate(g,xoff=offset).intersection(box(-180,-85,180,85)))
                if not clipped.is_empty:
                    features.append(dict(type='Feature',geometry=mapping(clipped),properties=dict(kind='shelf',source='USNIC 2022 ice shelf; display simplified')))
path=ROOT/'data/map_base.geojson'
path.write_text(json.dumps(dict(type='FeatureCollection',features=features),separators=(',',':')))
print(len(features),path.stat().st_size)
