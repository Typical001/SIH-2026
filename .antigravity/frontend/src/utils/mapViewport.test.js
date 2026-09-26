import {expect,it} from 'vitest';
import {minimumWorldZoom,longitudeNear,shiftGeoJSON} from './mapViewport';
import {prepareRoute,routeDistanceKm} from './icebergVisibility';

it('never exposes more than one world at minimum zoom across viewport sizes',()=>{
 for(const [width,height] of [[380,640],[960,520],[1920,1080],[2560,900]]) {
  const world=256*2**minimumWorldZoom(width,height);
  expect(world).toBeGreaterThanOrEqual(width);
  expect(world).toBeGreaterThanOrEqual(height);
 }
});
it('positions observations alongside routes across the date line',()=>{
 expect(longitudeNear(-179,181)).toBe(181);
 expect(longitudeNear(179,-181)).toBe(-181);
 expect(longitudeNear(30,45)).toBe(30);
});
it('keeps iceberg filtering valid for continuous route longitudes',()=>{
 const segments=prepareRoute([[-70,179],[-70,181]]);
 expect(segments).toHaveLength(1);
 expect(routeDistanceKm([-70,-179.5],segments)).toBeLessThan(1);
});
it('shifts polygon display copies without changing source geometry',()=>{
 const shape={type:'Polygon',coordinates:[[[179,-70],[180,-70],[179,-71],[179,-70]]]};
 const copy=shiftGeoJSON(shape,-360);
 expect(copy.coordinates[0][0]).toEqual([-181,-70]);
 expect(shape.coordinates[0][0]).toEqual([179,-70]);
});
