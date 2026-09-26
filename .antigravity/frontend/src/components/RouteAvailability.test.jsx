import React from 'react';
import {act,create} from 'react-test-renderer';
import {expect,it,vi} from 'vitest';
import TelemetrySidebar from './TelemetrySidebar';
it('disables unavailable profiles without invented metrics',async()=>{
 const select=vi.fn();let tree;
 await act(async()=>{tree=create(<TelemetrySidebar paretoRoutes={{features:[]}} onSelectRouteType={select}/>);});
 const cards=tree.root.findByProps({'aria-label':'Route choices'}).findAllByType('button');
 expect(cards).toHaveLength(3);for(const card of cards){expect(card.props.disabled).toBe(true);expect(card.findByType('p').children.join('')).toBe('Unavailable');}
 expect(select).not.toHaveBeenCalled();act(()=>tree.unmount());
});
