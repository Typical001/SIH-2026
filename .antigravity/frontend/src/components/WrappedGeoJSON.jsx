import React,{useMemo} from 'react';
import {GeoJSON} from 'react-leaflet';
import {shiftGeoJSON} from '../utils/mapViewport';

export default function WrappedGeoJSON({data,...props}) {
 const copies=useMemo(()=>[-360,0,360].map(offset=>shiftGeoJSON(data,offset)),[data]);
 return copies.map((copy,index)=><GeoJSON key={index} {...props} data={copy}/>);
}
