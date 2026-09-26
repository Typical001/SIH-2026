// Display filtering only: this never changes the backend routing hazard catalog.
const R = 6371;
const rad = degrees => degrees * Math.PI / 180;
const clamp = n => Math.max(-1, Math.min(1, n));
export const validPoint = p => Array.isArray(p) && p.length >= 2 &&
  Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180;
const vector = ([lat, lon]) => [Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat))];
const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const angle = (a, b) => Math.atan2(Math.hypot(...cross(a, b)), clamp(dot(a, b)));
export const distanceKm = (a, b) => R * angle(vector(a), vector(b));

export function prepareRoute(route) {
  // Do not bridge across invalid waypoints.
  return route.slice(1).flatMap((b, i) => {
    const a = route[i];
    if (!validPoint(a) || !validPoint(b)) return [];
    const av = vector(a), bv = vector(b), normal = cross(av, bv), length = Math.hypot(...normal);
    return [{ a: av, b: bv, angle: angle(av, bv), normal: length > 1e-10 ? normal.map(n => n / length) : null }];
  });
}

export function routeDistanceKm(point, segments) {
  const p = vector(point);
  let best = Infinity;
  for (const s of segments) {
    best = Math.min(best, angle(p, s.a), angle(p, s.b));
    if (!s.normal || s.angle >= Math.PI - 1e-8) continue;
    const height = dot(p, s.normal);
    const projection = p.map((n, i) => n - height * s.normal[i]);
    const length = Math.hypot(...projection);
    if (length < 1e-10) continue;
    const q = projection.map(n => n / length);
    if (angle(s.a, q) + angle(q, s.b) <= s.angle + 1e-8) best = Math.min(best, Math.asin(Math.min(1, Math.abs(height))));
  }
  return best * R;
}

export function inViewport(point, bounds) {
  if (!bounds || point[0] < bounds.south || point[0] > bounds.north) return false;
  let width = bounds.east - bounds.west;
  if (Math.abs(width) >= 360) return true;
  width = (width + 360) % 360;
  const offset = ((point[1] - bounds.west) % 360 + 360) % 360;
  return offset <= width;
}

export function indexIcebergs(present, predicted, route) {
  const records = new Map();
  for (const [kind, rows] of [['present', present], ['predicted', predicted]]) {
    for (const [i, row] of rows.entries()) {
      if (!validPoint([row.lat, row.lon])) continue;
      const id = row.id == null ? `${kind}-${i}` : String(row.id);
      records.set(id, { ...records.get(id), id, [kind]: row });
    }
  }
  const segments = prepareRoute(route);
  return [...records.values()].map(record => {
    const points = [record.present, record.predicted].filter(Boolean).map(p => [p.lat, p.lon]);
    const radius = record.predicted?.planning_hazard_radius_km ?? record.predicted?.safety_radius_km;
    const hazardRadiusKm = Number.isFinite(radius) ? Math.max(0, radius) : 0;
    const distance = Math.min(...points.map(p => routeDistanceKm(p, segments)));
    return { ...record, points, routeDistanceKm: distance, hazardRadiusKm };
  });
}

export function selectIcebergs(records, { mode, bounds, zoom, corridorKm = 50, limit = 150 }) {
  if (!bounds) return { items: [], matching: 0, limited: false };
  const center = [(bounds.south + bounds.north) / 2, ((bounds.west + bounds.east) / 2 + 540) % 360 - 180];
  const candidates = [];
  for (const record of records) {
    if (mode === 'route' && record.routeDistanceKm > corridorKm + record.hazardRadiusKm) continue;
    const position = record.points.find(p => inViewport(p, bounds));
    if (!position) continue;
    candidates.push({ ...record, position, rank: mode === 'route' ? record.routeDistanceKm - record.hazardRadiusKm : distanceKm(position, center) });
  }
  candidates.sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
  return { items: candidates.slice(0, limit), matching: candidates.length, limited: candidates.length > limit };
}
