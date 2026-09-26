// Loaded only on export; all numerical values come from the active API result.
export async function generateVoyageReportPDF({routeMetrics:m,waypoints=[],origin,destination,vesselIceClass,cruisingSpeed,forecastHours}, saveFile=true) {
 if(!m)return;
 const [{jsPDF},{default:autoTable}]=await Promise.all([import('jspdf'),import('jspdf-autotable')]);
 const doc=new jsPDF();
 doc.setFontSize(17);doc.text('PolarNav planning report',14,18);
 doc.setFontSize(9);
 doc.text(['OBSERVATION-BACKED DEMO - NOT A NAVIGATION CERTIFICATE',
  'Icebergs: provided USNIC report dated 24 September 2026, checked against official CSV.',
  'Land: Natural Earth 1:10m. Ice shelves: USNIC 2022. Forecast and environment: calculated estimates.',
  'Reported positions do not guarantee current conditions. Harbour / shore transfer legs are excluded.'],14,26);
 autoTable(doc,{startY:48,head:[['Planning input','Value']],body:[
  ['Origin',origin?.name||'Planning start'],['Destination',destination?.name||'Planning approach'],
  ['Vessel class',vesselIceClass],['Requested speed',String(cruisingSpeed)+' kn'],
  ['Estimated forecast horizon',String(forecastHours)+' h'],['Dataset',m.data_source||'Unavailable']]});
 autoTable(doc,{startY:doc.lastAutoTable.finalY+6,head:[['Computed metric','Value']],body:[
  ['Distance',String(m.distance_nautical_miles)+' NM'],['Estimated time',String(m.estimated_voyage_hours)+' h'],
  ['Estimated fuel burn',String(m.fuel_consumption_tons)+' t'],['Required reserve',String(m.reserve_mt)+' t'],
  ['Fuel feasibility',m.feasibility_status],['Estimated ice exposure (not probability)',String(m.risk_score)+' / 100'],
  ...(m.objective?[['Route objective',m.objective],['Cumulative estimated ice exposure',String(m.ice_exposure_hours)+' concentration-weighted hours'],['Shared corridor',m.shared_corridor_with?.join(', ')||'None at 90% overlap within 10 km']]:[]),
  ['Geometry check',m.geometry_validated?'Passed against bundled obstacles and estimated envelopes':'Unavailable'],
  ['Forecast covers voyage',m.forecast_covers_voyage?'Yes':'No - '+m.uncovered_voyage_hours+' h beyond forecast']]});
 doc.addPage();doc.setFontSize(13);doc.text('Offshore planning waypoints',14,18);
 autoTable(doc,{startY:25,head:[['Point','Latitude','Longitude']],body:waypoints.map((p,i)=>[i+1,p[0].toFixed(5),p[1].toFixed(5)])});
 for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);doc.setFontSize(8);doc.text('Dated observations + calculated estimates | Not for operational navigation',14,290);}
 if(saveFile) doc.save('PolarNav-planning-report.pdf');
 return doc;
}
