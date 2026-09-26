"""Local demo obstacle checks. Geometry follows the displayed lon/lat polyline.

Natural Earth is a generalized demo coastline, not a navigation chart.
Touching an obstacle counts as blocked. Missing data raises rather than clearing land.
"""
from functools import lru_cache
from pathlib import Path
import math
import io
import zipfile

import pyproj
import shapefile
from shapely.geometry import Point, LineString, Polygon, shape
from shapely.strtree import STRtree
from shapely.validation import make_valid


def wrap_lon(lon):
    return (float(lon) + 180) % 360 - 180


class LandMask:
    _tree = None
    _shelf_tree = None
    _shelf_transform = None

    @classmethod
    def _get_shelf(cls):
        if cls._shelf_tree is None:
            path = Path(__file__).parent.parent / 'research/iceberg-data/usnic_shelf_2022.zip'
            with zipfile.ZipFile(path) as z:
                base = 'USNIC_ANTARC_shelf_2022'
                crs = pyproj.CRS.from_wkt(z.read(base+'.prj').decode())
                cls._shelf_transform = pyproj.Transformer.from_crs('EPSG:4326', crs, always_xy=True)
                reader = shapefile.Reader(shp=io.BytesIO(z.read(base+'.shp')), dbf=io.BytesIO(z.read(base+'.dbf')), shx=io.BytesIO(z.read(base+'.shx')))
                cls._shelf_tree = STRtree([make_valid(shape(r.shape.__geo_interface__)) for r in reader.iterShapeRecords()])
        return cls._shelf_tree

    @classmethod
    def _get_tree(cls):
        if cls._tree is None:
            path = Path(__file__).parent / 'data' / 'ne_10m_land.zip'
            polygons = []
            with shapefile.Reader(str(path)) as reader:
                for record in reader.iterShapes():
                    geom = make_valid(shape(record.__geo_interface__))
                    polygons.extend(geom.geoms if hasattr(geom, 'geoms') else [geom])
            cls._tree = STRtree(polygons)
        return cls._tree

    @classmethod
    def is_land(cls, lat, lon):
        if len(cls._get_tree().query(Point(wrap_lon(lon), lat), predicate='intersects')): return True
        tree = cls._get_shelf()
        return lat < -55 and bool(len(tree.query(Point(*cls._shelf_transform.transform(lon,lat)),predicate='intersects')))

    @classmethod
    def segment_blocked(cls, a, b):
        lon_a = wrap_lon(a[1])
        lon_b = lon_a + wrap_lon(b[1] - a[1])
        # Shift the short segment across the date line to query both halves.
        shifts = (0, 360) if lon_b < -180 else (0, -360) if lon_b > 180 else (0,)
        for shift in shifts:
            line = LineString([(lon_a + shift, a[0]), (lon_b + shift, b[0])])
            if len(cls._get_tree().query(line, predicate='intersects')):
                return True
        if min(a[0],b[0]) < -55:
            tree=cls._get_shelf()
            steps=max(1,math.ceil(max(abs(b[0]-a[0]),abs(lon_b-lon_a))/.05))
            points=[cls._shelf_transform.transform(lon_a+(lon_b-lon_a)*i/steps,a[0]+(b[0]-a[0])*i/steps) for i in range(steps+1)]
            if len(tree.query(LineString(points),predicate='intersects')): return True
        return False


@lru_cache(maxsize=2048)
def _hazard_polygon(lat, lon, radius_km):
    geod = pyproj.Geod(ellps='WGS84')
    points = []
    # Circumscribed circle with a 1% conservative margin for polygon approximation.
    for bearing in range(0, 360, 2):
        x, y, _ = geod.fwd(lon, lat, bearing, radius_km * 1010)
        points.append((lon + wrap_lon(x - lon), y))
    return Polygon(points)


def segment_clear(a, b, hazards=()):
    if LandMask.is_land(*a) or LandMask.is_land(*b) or LandMask.segment_blocked(a, b):
        return False
    for hz in hazards:
        lon = hz['lon']
        ax = lon + wrap_lon(a[1] - lon)
        bx = ax + wrap_lon(b[1] - a[1])
        obstacle = _hazard_polygon(hz['lat'], lon, hz['radius_km'])
        if obstacle.intersects(LineString([(ax, a[0]), (bx, b[0])])):
            return False
    return True


def route_clear(points, hazards=()):
    if len(points) < 2:
        return False
    if any(not math.isfinite(v) for p in points for v in p):
        return False
    return all(segment_clear(a, b, hazards) for a, b in zip(points, points[1:]))
