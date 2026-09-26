import { describe, expect, it } from 'vitest';
import { indexIcebergs, inViewport, prepareRoute, routeDistanceKm, selectIcebergs } from './icebergVisibility';

const world = { south: -90, north: 90, west: -180, east: 180 };
const select = (records, options = {}) => selectIcebergs(records, { mode: 'route', zoom: 6, bounds: world, ...options });

describe('iceberg display filtering', () => {
  it('finds icebergs beside a segment, not only its endpoints', () => {
    const records = indexIcebergs([{ id: 'near', lat: 0.1, lon: 5 }, { id: 'far', lat: 5, lon: 5 }], [], [[0, 0], [0, 10]]);
    expect(select(records).items.map(i => i.id)).toEqual(['near']);
  });
  it('uses the short spherical arc across the dateline', () => {
    const route = prepareRoute([[0, 179], [0, -179]]);
    expect(routeDistanceKm([0, 180], route)).toBeLessThan(.001);
    expect(routeDistanceKm([0, 0], route)).toBeGreaterThan(19000);
    expect(inViewport([0, -179], { ...world, west: 170, east: -170 })).toBe(true);
    expect(inViewport([0, -179], { ...world, west: 170, east: 190 })).toBe(true);
    expect(inViewport([0, 0], { ...world, west: 170, east: -170 })).toBe(false);
  });
  it('handles high latitude arcs and coincident endpoints without NaN', () => {
    const route = prepareRoute([[-70, -45], [-70, 45]]);
    expect(routeDistanceKm([-75.56724496, 0], route)).toBeLessThan(.01);
    expect(routeDistanceKm([1, 0], prepareRoute([[0, 0], [0, 0]]))).toBeCloseTo(111.195, 2);
  });
  it('includes a forecast near the route even when the observation is far away', () => {
    const records = indexIcebergs([{ id: 'drifting', lat: 10, lon: 5 }], [{ id: 'drifting', lat: 0.6, lon: 5, safety_radius_km: 30 }], [[0, 0], [0, 10]]);
    const result = select(records, { bounds: { south: -1, north: 1, west: 0, east: 10 } });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].position).toEqual([.6, 5]);
  });
  it('does not render offscreen records or bridge invalid route coordinates', () => {
    const records = indexIcebergs([{ id: 'offscreen', lat: 0, lon: 5 }], [], [[0, 0], [0, 10]]);
    expect(select(records, { bounds: { south: 1, north: 2, west: 0, east: 10 } }).items).toHaveLength(0);
    expect(prepareRoute([[0, 0], [NaN, 5], [0, 10]])).toHaveLength(0);
  });
  it('allows explicit area exploration at overview zoom without a route', () => {
    const records = indexIcebergs([{ id: 'local', lat: -60, lon: 0 }], [], []);
    expect(select(records).items).toHaveLength(0);
    expect(select(records, { mode: 'area', zoom: 2 }).items).toHaveLength(1);
    expect(select(records, { mode: 'area', zoom: 5 }).items).toHaveLength(1);
  });
  it('bounds a dense catalog to 150 markers and discloses the remaining count', () => {
    const rows = Array.from({ length: 5000 }, (_, i) => ({ id: String(i), lat: 0, lon: i / 1000 }));
    const result = select(indexIcebergs(rows, [], [[0, 0], [0, 10]]));
    expect(result.items).toHaveLength(150);
    expect(result.matching).toBe(5000);
    expect(result.limited).toBe(true);
    expect(rows).toHaveLength(5000); // Display never prunes the source catalog.
  });
  it('rejects invalid positions while keeping legitimate zero coordinates', () => {
    const rows = [{ id: 'zero', lat: 0, lon: 0 }, { lat: null, lon: 0 }, { lat: NaN, lon: 0 }, { lat: 91, lon: 0 }, { lat: 0, lon: Infinity }];
    expect(indexIcebergs(rows, [], [[0, 0], [0, 1]]).map(i => i.id)).toEqual(['zero']);
  });
});
