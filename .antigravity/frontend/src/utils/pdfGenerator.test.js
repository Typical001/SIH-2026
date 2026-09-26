import {expect,it} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {generateVoyageReportPDF} from './pdfGenerator';
it('exports real route values and explicit source/estimate labels without fabricated safety percentages',async()=>{
 const doc=await generateVoyageReportPDF({routeMetrics:{distance_nautical_miles:3371.15,estimated_voyage_hours:243.16,fuel_consumption_tons:219.181,reserve_mt:75,feasibility_status:'FEASIBLE',risk_score:3.78,geometry_validated:true,forecast_covers_voyage:false,uncovered_voyage_hours:171.2,data_source:'usnic-2026-09-24-test',objective:'Minimum cumulative estimated ice exposure; shortest time breaks ties',ice_exposure_hours:10.619,shared_corridor_with:['BALANCED']},waypoints:[[-34,18],[-60,30]],origin:{name:'Cape Town'},destination:{name:'Bharati'},vesselIceClass:'PC3',cruisingSpeed:14.5,forecastHours:72},false);
 expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
 const text=doc.output();expect(text).toContain('219.181');expect(text).toContain('10.619');expect(text).toContain('BALANCED');expect(text).toContain('Route objective');expect(text).toContain('NOT A NAVIGATION CERTIFICATE');expect(text).toContain('24 September 2026');expect(text).not.toContain('100%');
 mkdirSync('../.run',{recursive:true});writeFileSync('../.run/export-verification.pdf',Buffer.from(doc.output('arraybuffer')));
});
