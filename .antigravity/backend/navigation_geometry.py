"""Spherical geometry shared by routing, collision checks and baseline output.

Coordinates are (latitude, longitude); distances use a 3440.065 NM sphere.
"""
import math


EARTH_NM = 3440.065


def haversine_nm(lat1, lon1, lat2, lon2):
    a, b = math.radians(lat1), math.radians(lat2)
    h = math.sin((b - a) / 2) ** 2 + math.cos(a) * math.cos(b) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    h = min(1.0, max(0.0, h))
    return EARTH_NM * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))


def haversine_km(lat1, lon1, lat2, lon2):
    return haversine_nm(lat1, lon1, lat2, lon2) * 1.852


def bearing(a, b):
    lat1, lat2 = math.radians(a[0]), math.radians(b[0])
    delta = math.radians(b[1] - a[1])
    return math.atan2(math.sin(delta) * math.cos(lat2),
                      math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(delta))


def great_circle_points(a, b, max_step_km=5.0):
    distance = haversine_km(*a, *b)
    if distance < 1e-9:
        return [tuple(a)]
    angle = distance / (EARTH_NM * 1.852)
    count = max(1, math.ceil(distance / max_step_km))
    def vector(p):
        lat, lon = map(math.radians, p)
        return (math.cos(lat) * math.cos(lon), math.cos(lat) * math.sin(lon), math.sin(lat))
    u, v = vector(a), vector(b)
    points = [tuple(a)]
    for i in range(1, count):
        f = i / count
        left, right = math.sin((1-f) * angle) / math.sin(angle), math.sin(f * angle) / math.sin(angle)
        x, y, z = [left * u[j] + right * v[j] for j in range(3)]
        points.append((math.degrees(math.atan2(z, math.hypot(x, y))), math.degrees(math.atan2(y, x))))
    points.append(tuple(b))
    return points


def segment_distance_km(point, a, b):
    """Minimum distance to the minor great-circle arc, including both endpoints."""
    arc = haversine_nm(*a, *b) / EARTH_NM
    if arc < 1e-12:
        return haversine_km(*point, *a)
    d = haversine_nm(*a, *point) / EARTH_NM
    delta = bearing(a, point) - bearing(a, b)
    cross = math.asin(max(-1.0, min(1.0, math.sin(d) * math.sin(delta))))
    along = math.atan2(math.sin(d) * math.cos(delta), math.cos(d))
    if 0 <= along <= arc:
        return abs(cross) * EARTH_NM * 1.852
    return min(haversine_km(*point, *a), haversine_km(*point, *b))
