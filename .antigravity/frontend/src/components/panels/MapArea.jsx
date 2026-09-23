import React from 'react';
import PolarMap from '../PolarMap';

export default function MapArea(props) {
  return (
    <main className="flex-1 relative h-full">
      <PolarMap {...props} />
    </main>
  );
}
