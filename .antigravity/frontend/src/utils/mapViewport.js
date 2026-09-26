// A viewport must never span more than one complete 256px tile-world.
export function minimumWorldZoom(width, height) {
  return Math.ceil(Math.log2(Math.max(1, width, height) / 256) * 10) / 10;
}

export function longitudeNear(lon, reference) {
  return lon + 360 * Math.round((reference - lon) / 360);
}

export function shiftGeoJSON(data, offset) {
  if(!data || !offset)return data;
  const coords=c=>typeof c[0]==='number'?[c[0]+offset,...c.slice(1)]:c.map(coords);
  if(data.type==='FeatureCollection')return {...data,features:data.features.map(f=>shiftGeoJSON(f,offset))};
  if(data.type==='Feature')return {...data,geometry:shiftGeoJSON(data.geometry,offset)};
  if(data.type==='GeometryCollection')return {...data,geometries:data.geometries.map(g=>shiftGeoJSON(g,offset))};
  return {...data,coordinates:coords(data.coordinates)};
}
