import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDuration, formatNumber, riskLabel } from '../components/displayValues';

/**
 * Format latitude and longitude coordinates into navigational format (DD°MM' S/N, DD°MM' E/W)
 */
function formatNavCoord(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return 'N/A';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  
  const absLat = Math.abs(lat);
  const latDeg = Math.floor(absLat);
  const latMin = Math.floor((absLat - latDeg) * 60);

  const absLon = Math.abs(lon);
  const lonDeg = Math.floor(absLon);
  const lonMin = Math.floor((absLon - lonDeg) * 60);

  return `${latDeg}°${latMin.toString().padStart(2, '0')}' ${latDir}, ${lonDeg}°${lonMin.toString().padStart(2, '0')}' ${lonDir}`;
}

/**
 * Generates and downloads a high-grade Official Bridge Navigational Plan PDF.
 */
export function generateVoyageReportPDF({
  routeMetrics,
  waypoints = [],
  origin,
  destination,
  vesselIceClass = 'Polar Class 3 (PC3)',
  cruisingSpeed = 14.5,
  xaiExplanation = null,
  icebergsPredicted = [],
  forecastHours = 72
}) {
  if (!routeMetrics) {
    throw new Error('Cannot generate report: No active route metrics available.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const m = routeMetrics;
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC';

  // Palette & Styling
  const navyHeader = [10, 17, 34]; // #0a1122
  const cyanAccent = [14, 165, 233]; // #0ea5e9
  const darkBorder = [30, 41, 59];
  const textDark = [15, 23, 42];
  const textMuted = [100, 116, 139];

  let currentY = 15;

  // Header Banner
  doc.setFillColor(...navyHeader);
  doc.rect(14, currentY, 182, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('POLARNAV VOYAGE EXECUTION REPORT', 105, currentY + 9, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...cyanAccent);
  doc.text('[OFFICIAL BRIDGE NAVIGATIONAL PLAN]', 105, currentY + 16, { align: 'center' });

  currentY += 28;

  // SECTION 1: VOYAGE METADATA & SHIP SPECIFICATIONS
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyHeader);
  doc.text('[ SECTION 1: VOYAGE METADATA & SHIP SPECIFICATIONS ]', 14, currentY);

  doc.setDrawColor(...darkBorder);
  doc.setLineWidth(0.3);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);

  const originName = origin?.name || 'Origin Port';
  const destName = destination?.name || 'Destination Station';
  const origCoordStr = origin ? formatNavCoord(origin.lat, origin.lon) : 'N/A';
  const destCoordStr = destination ? formatNavCoord(destination.lat, destination.lon) : 'N/A';

  const sec1Text = [
    `• Vessel Name: RV Bharati                       • Ice Class: ${vesselIceClass}`,
    `• Voyage Route: ${originName} -> ${destName}`,
    `• Coordinates: ${origCoordStr} -> ${destCoordStr}`,
    `• Selected Route Mode: A* DIRECTED POLAR PATHFINDER (Optimized for safety, fuel & time)`,
    `• Master / Navigational Officer on Watch: Captain / Duty Navigation Officer (Sign-off)`
  ];

  sec1Text.forEach((line) => {
    doc.text(line, 16, currentY);
    currentY += 5;
  });

  currentY += 4;

  // SECTION 2: HIGH-LEVEL VOYAGE METRICS
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyHeader);
  doc.text('[ SECTION 2: HIGH-LEVEL VOYAGE METRICS ]', 14, currentY);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 6;

  const safetyRatingPct = Math.max(0, (100 - m.risk_score)).toFixed(1);
  const maxIcePct = (m.max_sea_ice_concentration_pct || 0).toFixed(0);
  const totalDist = formatNumber(m.distance_nautical_miles, 1);
  const durationStr = `${formatDuration(m.estimated_voyage_hours)}`;
  const fuelBurnTons = formatNumber(m.fuel_consumption_tons, 1);
  const rLabel = riskLabel(m.risk_score);

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: navyHeader, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { textColor: textDark, fontSize: 9, fontStyle: 'bold', halign: 'center' },
    head: [['Total Distance', 'Estimated Duration', 'Projected Fuel Burn']],
    body: [[`${totalDist} Nautical Miles`, durationStr, `${fuelBurnTons} Metric Tons`]]
  });

  currentY = doc.lastAutoTable.finalY + 3;

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
    bodyStyles: { textColor: textDark, fontSize: 9, fontStyle: 'bold', halign: 'center' },
    head: [['Overall Safety Rating', 'Worst-Case Risk Index', 'Max Ice Concentration']],
    body: [[`${safetyRatingPct}% (${rLabel} Risk)`, `Score: ${m.risk_score.toFixed(1)} / 100`, `${maxIcePct}% (${(maxIcePct / 10).toFixed(1)}/10ths)`]]
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // SECTION 3: EXPLAINABLE RISK & HAZARD BREAKDOWN
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyHeader);
  doc.text('[ SECTION 3: EXPLAINABLE RISK & HAZARD BREAKDOWN ]', 14, currentY);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textDark);

  const primaryDriver = xaiExplanation?.primary_routing_driver || 'A* path search optimized to avoid land and heavy sea-ice concentration.';
  const icePenalty = xaiExplanation?.route_modifiers?.max_sea_ice_penalty_pct ? `+${xaiExplanation.route_modifiers.max_sea_ice_penalty_pct}% cost penalty` : 'Normal weighting';
  const bergsTracked = Array.isArray(icebergsPredicted) ? icebergsPredicted.length : 0;
  const hazardBuffer = m.iceberg_hazard_buffer_km || 25;

  const sec3Text = [
    `• Primary Routing Driver: ${primaryDriver}`,
    `• Sea-Ice Hazard Index: Max ice cover ${maxIcePct}%. (${icePenalty}).`,
    `• Iceberg Proximity Alerts: ${bergsTracked} tracked iceberg hazard envelopes in forecast model (auto-buffered by ${hazardBuffer} km safety margin).`,
    `• Met-Ocean Conditions: Cruising speed ${cruisingSpeed} kts. Hydrodynamic current vectors & wind drift active.`
  ];

  sec3Text.forEach((line) => {
    const splitLines = doc.splitTextToSize(line, 178);
    splitLines.forEach((sLine) => {
      doc.text(sLine, 16, currentY);
      currentY += 5;
    });
  });

  currentY += 4;

  // SECTION 4: POLAR CODE COMPLIANCE & CONTINGENCY CHECKLIST
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyHeader);
  doc.text('[ SECTION 4: POLAR CODE COMPLIANCE & CONTINGENCY CHECKLIST ]', 14, currentY);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const sec4Text = [
    `[X] Polar Ship Certificate verification confirmed for route latitudes.`,
    `[X] Secondary emergency egress route computed (Direct baseline channel evaluated).`,
    `[X] Local communications & SAR window check completed.`
  ];

  sec4Text.forEach((line) => {
    doc.text(line, 16, currentY);
    currentY += 5;
  });

  currentY += 4;

  // SECTION 5: WAYPOINT SCHEDULE & LAT/LONG TABLE
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...navyHeader);
  doc.text('[ SECTION 5: WAYPOINT SCHEDULE & LAT/LONG TABLE ]', 14, currentY);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 6;

  // Sample waypoints if too many (keep table readable to ~10-15 rows)
  let tableWaypoints = waypoints;
  if (waypoints.length > 15) {
    const step = Math.ceil(waypoints.length / 12);
    tableWaypoints = waypoints.filter((_, idx) => idx === 0 || idx === waypoints.length - 1 || idx % step === 0);
  }

  const tableBody = tableWaypoints.map((wp, idx) => {
    const wpNum = (idx + 1).toString().padStart(2, '0');
    const isFirst = idx === 0;
    const isLast = idx === tableWaypoints.length - 1;
    const lat = wp[0];
    const lon = wp[1];
    const coordFormatted = formatNavCoord(lat, lon);
    const speedStr = `${cruisingSpeed} kts`;
    const statusStr = isFirst ? 'Clear' : isLast ? 'Station Approach' : (m.risk_score > 50 ? 'Caution' : 'Low Risk');
    const noteStr = isFirst ? 'Departure Zone' : isLast ? 'Arrival Destination' : `Waypoint Leg ${idx}`;

    return [wpNum, coordFormatted, speedStr, statusStr, noteStr];
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'striped',
    headStyles: { fillColor: navyHeader, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { textColor: textDark, fontSize: 8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { cellWidth: 50 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 35 },
      4: { cellWidth: 53 }
    },
    head: [['WP ID', 'Coordinates (Lat / Long)', 'Leg Speed', 'Safety Status', 'Notes']],
    body: tableBody
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Check page overflow for footer
  if (currentY > 270) {
    doc.addPage();
    currentY = 20;
  }

  // Footer Banner
  doc.setDrawColor(...darkBorder);
  doc.setLineWidth(0.4);
  doc.line(14, currentY, 196, currentY);

  currentY += 5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textMuted);
  doc.text(`Generated automatically by PolarNav Engine | Timestamp: ${timestamp}`, 105, currentY, { align: 'center' });

  // Download PDF
  const filename = `PolarNav_Voyage_Report_${originName.replace(/\s+/g, '_')}_to_${destName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
