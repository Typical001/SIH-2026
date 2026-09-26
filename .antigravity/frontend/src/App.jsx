import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import Navbar from './components/Navbar';
import PolarMap from './components/PolarMap';
import TelemetrySidebar from './components/TelemetrySidebar';
import ControlDeck, { POLAR_GATEWAYS, ANTARCTIC_STATIONS } from './components/ControlDeck';
import RouteComparisonModal from './components/RouteComparisonModal';
import { generateVoyageReportPDF } from './utils/pdfGenerator';
import { AlertTriangle, ShieldCheck } from 'lucide-react';


export function metricsFromFeature(feature) {
 const p=feature.properties;
 return {...p,distance_nautical_miles:p.distance_nm,estimated_voyage_days:(p.eta_hours/24).toFixed(1),
 estimated_voyage_hours:p.eta_hours,fuel_savings_percent:p.fuel_savings_pct,
 fuel_consumption_tons:p.total_fuel_burn_mt,max_sea_ice_concentration_pct:p.max_ice_concentration,
 risk_rating:'Estimated ice exposure',min_iceberg_distance_km:null};
}

function usePlanningState(key, initial) {
 const [value,setValue]=useState(()=>{try {const saved=localStorage.getItem('polarnav-v2-'+key);const parsed=saved===null?initial:JSON.parse(saved);return key==='forecastHours'?(Number.isFinite(parsed)?Math.min(72,Math.max(24,parsed)):72):parsed;}catch{return initial;}});
 useEffect(()=>{try{localStorage.setItem('polarnav-v2-'+key,JSON.stringify(value));}catch{}},[key,value]);
 return [value,setValue];
}

export default function App() {
  const [expandedMap,setExpandedMap]=useState(false);
  // In-Voyage Departure & Routing Modes
  const [departureMode, setDepartureMode] = usePlanningState('departureMode', 'GATEWAY'); // 'GATEWAY' | 'CURRENT_SHIP_GPS' | 'MID_OCEAN_COORDINATES'
  const [selectedGateway, setSelectedGateway] = usePlanningState('selectedGateway', 'ZACPT'); // Cape Town Port default
  const [selectedStation, setSelectedStation] = usePlanningState('selectedStation', 'bharati_station'); // Bharati Indian Antarctic Base default
  const [shipCoords, setShipCoords] = usePlanningState('shipCoords', [-64.50, 72.00]); // MV Vasiliy Golovnin fallback AIS fix
  const [vesselImo] = useState(9577133); // NCPOR chartered polar expedition vessel IMO

  // Navigation Parameters
  const [forecastHours, setForecastHours] = usePlanningState('forecastHours', 72);
  const [vesselIceClass, setVesselIceClass] = usePlanningState('vesselIceClass', 'Polar Class 3 (PC3)');
  const [safetyBufferKm, setSafetyBufferKm] = usePlanningState('safetyBufferKm', 25);
  const [cruisingSpeed, setCruisingSpeed] = usePlanningState('cruisingSpeed', 14.5);

  // Pareto-optimal 3-route & Bunker Fuel States
  const [paretoRoutes, setParetoRoutes] = useState(null); // GeoJSON FeatureCollection
  const [activeRouteType, setActiveRouteType] = useState('BALANCED'); // 'SAFEST' | 'BALANCED' | 'FASTEST'
  const activeRouteTypeRef = useRef(activeRouteType);
  activeRouteTypeRef.current = activeRouteType;
  const [remainingFuelMt, setRemainingFuelMt] = usePlanningState('remainingFuelMt', 450.0); // 200 MT initial bunker reserve
  const [maxTankCapacityMt] = useState(500.0);
  const [referenceBurn, setReferenceBurn] = usePlanningState('referenceBurn', 12);
  const [reservePercent, setReservePercent] = usePlanningState('reservePercent', 15); // Polar Class standard capacity

  // Operational State & Status Advisories
  const [loading, setLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [fallbackAdvisory, setFallbackAdvisory] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const activeRequest = useRef(null);

  // Route & Metocean Data
  const [waypoints, setWaypoints] = useState([]);
  const [directWaypoints, setDirectWaypoints] = useState([]);
  const [icebergsPresent, setIcebergsPresent] = useState([]);
  const [icebergsPredicted, setIcebergsPredicted] = useState([]);
  const [routeMetrics, setRouteMetrics] = useState(null);
  const [metoceanGrid] = useState([]);

  // Checkbox State Management for Map Display Layers
  const [layerVisibility, setLayerVisibility] = useState({
    seaIce: false,
    refIcebergs: false,
    sarCandidates: false,
    predictedIcebergs: true,
    riskHeatmap: true,
    optimizedRoutes: true,
    oceanCurrents: false,
    weatherWind: false,
    bathymetry: false
  });

  const toggleLayer = (layerKey) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  // Real-Time Satellite & Oceanographic Layer Data States
  const [byuIcebergData, setByuIcebergData] = useState(null);
  const [sarFootprintsData, setSarFootprintsData] = useState(null);
  const [seaIceLayerData, setSeaIceLayerData] = useState(null);
  const [oceanCurrentsData, setOceanCurrentsData] = useState(null);
  const [weatherWindData, setWeatherWindData] = useState(null);
  const [layersSyncStatus, setLayersSyncStatus] = useState('Dated observations + estimates');

  // Resolve Effective Origin & Destination
  const currentGateway = POLAR_GATEWAYS.find(g => g.code === selectedGateway) || POLAR_GATEWAYS[0];
  const currentStation = ANTARCTIC_STATIONS.find(s => s.id === selectedStation) || ANTARCTIC_STATIONS[0];

  const originCoords = departureMode === 'GATEWAY'
    ? { lat: currentGateway.lat, lon: currentGateway.lon }
    : { lat: Number(shipCoords[0]), lon: Number(shipCoords[1]) };

  const destinationCoords = { lat: currentStation.lat, lon: currentStation.lon };

  const originLabel = departureMode === 'GATEWAY'
    ? currentGateway.name
    : departureMode === 'CURRENT_SHIP_GPS'
      ? `Saved planning waypoint (IMO ${vesselImo})`
      : 'Southern Ocean Waypoint (Map Click)';

  const destLabel = currentStation.name;

  const getApiUrl = useCallback(() => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null' && window.location.origin.startsWith('http')) {
      return window.location.origin;
    }
    return 'http://localhost:8000';
  }, []);

  // Fetch Health & Satellite Sync Mode
  const fetchHealth = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const resp = await fetch(`${apiUrl}/api/health`);
      if (resp.ok) {
        const healthData = await resp.json();
        setSystemHealth(healthData);
      }
    } catch (e) {
      console.warn('Health check failed:', e);
    }
  }, [getApiUrl]);

  // Acquire Live/Last Vessel AIS Fix from SQLite Edge DB
  const handleAcquireShipGps = useCallback(async () => {
    try {
      const apiUrl = getApiUrl();
      const resp = await fetch(`${apiUrl}/api/v1/vessel/last-fix?vessel_imo=${vesselImo}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.fix && typeof data.fix.lat === 'number' && typeof data.fix.lon === 'number') {
          setShipCoords([data.fix.lat, data.fix.lon]);
          setDepartureMode('CURRENT_SHIP_GPS');
        }
      }
    } catch (e) {
      console.warn('Failed to acquire vessel GPS fix:', e);
    }
  }, [getApiUrl, vesselImo]);

  // Map Click Handler for Ocean Waypoints
  const handleMapClickCoord = useCallback((coords) => {
    setShipCoords(coords);
  }, []);

  // Fetch Auxiliary Real-Time GIS Layers (BYU, SAR, Sea Ice, Currents, Wind, Status)
  const fetchAuxiliaryLayers = useCallback(async () => {
    const apiUrl = getApiUrl();
    try {
      const [byu, sar, seaIce, currents, wind, stat] = await Promise.all([
        fetch(`${apiUrl}/api/v1/layers/byu-icebergs`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/v1/layers/sar-candidates`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/v1/layers/sea-ice`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/v1/layers/ocean-currents?lat=${originCoords.lat}&lon=${originCoords.lon}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/v1/layers/weather-wind?lat=${originCoords.lat}&lon=${originCoords.lon}`).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${apiUrl}/api/v1/layers/status`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      if (byu?.geojson) setByuIcebergData(byu.geojson);
      if (sar?.geojson) setSarFootprintsData(sar.geojson);
      if (seaIce?.geojson) setSeaIceLayerData(seaIce.geojson);
      if (currents?.geojson) setOceanCurrentsData(currents.geojson);
      if (wind?.geojson) setWeatherWindData(wind.geojson);
      if (stat?.overall_sync_label) setLayersSyncStatus(stat.overall_sync_label);
    } catch (e) {
      console.warn('Failed to load auxiliary GIS layers:', e);
    }
  }, [getApiUrl, originCoords.lat, originCoords.lon]);

  // Fetch Route from FastAPI Backend with In-Voyage Re-planning & Circuit Breakers
  const fetchRoute = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    let timedOut = false;
    const deadline = setTimeout(() => { timedOut = true; controller.abort(); }, 30000);
    setLoading(true);
    setErrorMsg(null);
    setFallbackAdvisory(null);
    setParetoRoutes(null);
    setWaypoints([]);
    setDirectWaypoints([]);
    setRouteMetrics(null);
    setIcebergsPredicted([]);

    fetchHealth();

    try {
      const apiUrl = getApiUrl();

      // Dispatch unified In-Voyage routing payload
      const calcPayload = {
        origin_type: departureMode,
        gateway_code: selectedGateway,
        destination_station_id: selectedStation,
        origin_coords: departureMode !== 'GATEWAY' ? [originCoords.lat, originCoords.lon] : undefined,
        start_lat: departureMode === 'GATEWAY' ? undefined : originCoords.lat,
        start_lon: departureMode === 'GATEWAY' ? undefined : originCoords.lon,
        forecast_hours: forecastHours,
        safety_buffer_km: safetyBufferKm,
        vessel_imo: vesselImo,
        remaining_fuel_mt: remainingFuelMt,
        max_tank_capacity_mt: maxTankCapacityMt,
        vessel_ice_class: vesselIceClass,
        cruising_speed_knots: cruisingSpeed,
        grid_resolution_deg: 0.8,
        reference_burn_mt_day: referenceBurn,
        reserve_percent: reservePercent
      };

      // Overlay data must not hold the route spinner open.
      fetch(`${apiUrl}/api/v1/icebergs?forecast_hours=${forecastHours}&safety_buffer_km=${safetyBufferKm}`, {
        signal: controller.signal
      }).then(r => r.ok ? r.json() : null).then(ibData => {
        if (!ibData || controller.signal.aborted || activeRequest.current !== controller) return;
        setIcebergsPresent(ibData.icebergs_present || []);
        const details = new Map((ibData.detailed_forecasts || []).map(fc => [String(fc.iceberg_id), fc]));
        setIcebergsPredicted((ibData.icebergs_predicted_72h || []).map(ib => ({
          ...ib, trajectory_points: details.get(String(ib.id))?.trajectory_points || ib.trajectory_points,
        })));
      }).catch(() => {});
      const calcRes = await fetch(`${apiUrl}/api/v1/calculate-route`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calcPayload), signal: controller.signal
      });

      if (controller.signal.aborted || activeRequest.current !== controller) return;

      if (!calcRes.ok) {
        const failure = await calcRes.json().catch(() => ({}));
        if (failure.detail?.message) throw new Error(failure.detail.message);
        throw new Error(`Routing calculation failed with status ${calcRes.status}`);
      }

      const paretoData = await calcRes.json();
      if (controller.signal.aborted || activeRequest.current !== controller) return;

      if (paretoData && paretoData.type === 'FeatureCollection' && Array.isArray(paretoData.features)) {
        setParetoRoutes(paretoData);

        // Check if Tier 2 Circuit Breaker was triggered
        const hasFallback = paretoData.features.some(f => f.properties?.flags?.includes('GEOMETRIC_SAFETY_CORRIDOR_FALLBACK'));
        if (hasFallback) {
          setFallbackAdvisory('GEOMETRIC_SAFETY_CORRIDOR_FALLBACK: High-density pack ice barrier detected. Activated 15 km tangential corridor bypass.');
        }

        // Auto-promote recommendation if Safest is unreachable
        if (paretoData.metadata?.auto_switched && paretoData.metadata?.recommended_route_type) {
          setActiveRouteType(paretoData.metadata.recommended_route_type);
        }

        // Set active route geometry & metrics
        const activeFeature = paretoData.features.find(f => f.properties?.route_type === paretoData.metadata?.recommended_route_type) || paretoData.features.find(f => f.properties?.route_type === activeRouteTypeRef.current) || paretoData.features[0];
        if (activeFeature) {
          setActiveRouteType(activeFeature.properties.route_type);
          const wpts = activeFeature.properties?.waypoints_latlon || [];
          setWaypoints(wpts);
          setDirectWaypoints([[originCoords.lat, originCoords.lon], [destinationCoords.lat, destinationCoords.lon]]);
          setRouteMetrics(metricsFromFeature(activeFeature));
        }
      }

    } catch (err) {
      if (activeRequest.current !== controller || (controller.signal.aborted && !timedOut)) return;
      console.warn('In-voyage route calculation error:', err);
      setParetoRoutes(null);
      setWaypoints([]);
      setDirectWaypoints([]);
      setRouteMetrics(null);
      setErrorMsg(timedOut ? 'Route calculation timed out after 30 seconds. Please retry or choose a shorter demo passage.' : `Navigation trajectory recalculation failed. ${err.message}`);
    } finally {
      clearTimeout(deadline);
      if (activeRequest.current === controller) setLoading(false);
    }
  }, [
    departureMode,
    selectedGateway,
    selectedStation,
    originCoords.lat,
    originCoords.lon,
    destinationCoords.lat,
    destinationCoords.lon,
    vesselImo,
    vesselIceClass,
    cruisingSpeed,
    remainingFuelMt,
    maxTankCapacityMt,
    referenceBurn,
    reservePercent,
    refreshToken,
    forecastHours,
    safetyBufferKm,
    getApiUrl,
    fetchHealth
  ]);

  // Synchronize route display when active route profile tab is switched
  useEffect(() => {
    if (paretoRoutes?.features) {
      const activeFeature = paretoRoutes.features.find(f => f.properties?.route_type === activeRouteType);
      if (activeFeature) {
        setWaypoints(activeFeature.properties?.waypoints_latlon || []);
        setRouteMetrics(metricsFromFeature(activeFeature));
      } else {
        setWaypoints([]);
        setRouteMetrics(null);
      }
    }
  }, [activeRouteType, paretoRoutes]);

  // High-Grade Official Bridge Navigational Plan PDF Export Handler
  const handleExportPDF = useCallback(async () => {
    if (!routeMetrics) return;
    try {
      await generateVoyageReportPDF({
        routeMetrics,
        waypoints,
        origin: { name: originLabel, lat: originCoords.lat, lon: originCoords.lon },
        destination: { name: destLabel, lat: destinationCoords.lat, lon: destinationCoords.lon },
        vesselIceClass,
        cruisingSpeed,
        icebergsPredicted,
        forecastHours
      });
    } catch (err) {
      console.error('Failed to export PDF report:', err);
    }
  }, [routeMetrics, waypoints, originLabel, originCoords.lat, originCoords.lon, destLabel, destinationCoords.lat, destinationCoords.lon, vesselIceClass, cruisingSpeed, icebergsPredicted, forecastHours]);

  // Clear previous results before painting changed inputs.
  useLayoutEffect(() => {
    fetchHealth();
    fetchRoute();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [fetchRoute, fetchHealth]);
  useEffect(() => { fetchAuxiliaryLayers(); }, [fetchAuxiliaryLayers]);

  const resetDemo = () => {
    setErrorMsg(null);
    setRefreshToken(value=>value+1);
    setActiveRouteType('BALANCED');
    setLayerVisibility({seaIce:false,refIcebergs:false,sarCandidates:false,predictedIcebergs:true,riskHeatmap:true,optimizedRoutes:true,oceanCurrents:false,weatherWind:false,bathymetry:false});
    activeRequest.current?.abort(); setDepartureMode('GATEWAY'); setSelectedGateway('ZACPT'); setSelectedStation('bharati_station');
    setShipCoords([-64.5,72]); setForecastHours(72); setVesselIceClass('Polar Class 3 (PC3)'); setSafetyBufferKm(25); setCruisingSpeed(14.5); setRemainingFuelMt(450); setReferenceBurn(12); setReservePercent(15); setIsReportOpen(false);
  };
  return (
    <div className={`planner-shell ${expandedMap?'map-expanded':''} flex flex-col h-screen w-screen overflow-hidden bg-[#050b18]`}>
      <button type="button" aria-pressed={expandedMap} onClick={()=>setExpandedMap(value=>!value)} className="map-space-toggle bg-slate-950 text-cyan-200 border border-cyan-700 rounded px-3 py-2 text-xs shadow-lg">{expandedMap?'Show planning panels':'Expand map'}</button>
      {/* Top Mission Navbar */}
      <Navbar
        loading={loading}
        onRefresh={() => { fetchRoute(); fetchAuxiliaryLayers(); }}
        onOpenReport={() => setIsReportOpen(true)}
        vesselIceClass={vesselIceClass}
        forecastHours={forecastHours}
        systemHealth={systemHealth}
      />

      {/* Circuit Breaker Advisory Toast */}
      <div className="bg-sky-950 text-sky-100 text-xs px-4 py-1 border-b border-sky-800">
        Observation-backed demo · USNIC 24 Sep 2026 · Forecasts, environment and vessel metrics are calculated estimates. Offshore approach legs only.
      </div>
      {fallbackAdvisory && (
        <div role="status" className="flex items-center gap-2 border-b border-amber-500/50 bg-amber-950/90 px-5 py-2 text-xs font-mono text-amber-200 shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{fallbackAdvisory}</span>
        </div>
      )}

      {/* Routing Failure Error Alert */}
      {errorMsg && (
        <div role="alert" className="flex items-center justify-between gap-4 border-b border-red-500/40 bg-red-950 px-5 py-3 text-sm text-red-100 shrink-0">
          <p>{errorMsg}</p>
          <button
            type="button"
            onClick={() => { fetchRoute(); fetchAuxiliaryLayers(); }}
            disabled={loading}
            className="rounded border border-red-300/50 px-3 py-1 font-semibold hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-slate-950 text-xs text-slate-300 px-4 py-1 flex justify-between"><span>{loading ? 'Calculating for current inputs; previous routes cleared.' : paretoRoutes?.metadata?.approach_note}</span><button onClick={resetDemo} className="border border-slate-600 rounded px-2">Reset demo</button></div>
      {/* Main Workspace Area: Sidebar + Polar Map */}
      <div className="planner-workspace flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left Telemetry Sidebar */}
        <TelemetrySidebar
          routeMetrics={routeMetrics}
          vesselIceClass={vesselIceClass}
          cruisingSpeed={cruisingSpeed}
          loading={loading}
          paretoRoutes={paretoRoutes}
          activeRouteType={activeRouteType}
          remainingFuelMt={remainingFuelMt}
          onChangeRemainingFuel={setRemainingFuelMt}
          maxTankCapacityMt={maxTankCapacityMt}
          referenceBurn={referenceBurn} onChangeReferenceBurn={setReferenceBurn}
          reservePercent={reservePercent} onChangeReservePercent={setReservePercent}
          onSelectRouteType={setActiveRouteType}
          onExportPDF={handleExportPDF}
          onOpenReport={() => setIsReportOpen(true)}
          layerVisibility={layerVisibility}
          onToggleLayer={toggleLayer}
          layersSyncStatus={layersSyncStatus}
        />

        {/* Central Polar Map Deck */}
        <main className="flex-1 relative h-full">
          <PolarMap
            waypoints={waypoints}
            directWaypoints={directWaypoints}
            icebergsPresent={icebergsPresent}
            icebergsPredicted={icebergsPredicted.map(ib => ({...ib, safety_radius_km:ib.safety_radius_km+(routeMetrics?.iceberg_hazard_buffer_km ?? safetyBufferKm)-safetyBufferKm, planning_hazard_radius_km:ib.planning_hazard_radius_km+(routeMetrics?.iceberg_hazard_buffer_km ?? safetyBufferKm)-safetyBufferKm}))}
            forecastHours={forecastHours}
            safetyBufferKm={routeMetrics?.iceberg_hazard_buffer_km ?? safetyBufferKm}
            metoceanGrid={metoceanGrid}
            layerVisibility={layerVisibility}
            byuIcebergData={byuIcebergData}
            sarFootprintsData={sarFootprintsData}
            seaIceLayerData={seaIceLayerData}
            oceanCurrentsData={oceanCurrentsData}
            weatherWindData={weatherWindData}
            origin={originCoords}
            destination={destinationCoords}
            originLabel={originLabel}
            destLabel={destLabel}
            departureMode={departureMode}
            onMapClickCoord={handleMapClickCoord}
            routeMetrics={routeMetrics}
            paretoRoutes={paretoRoutes}
            activeRouteType={activeRouteType}
            onSelectRouteType={setActiveRouteType}
          />
        </main>
      </div>

      {/* Bottom Mission Control Deck */}
      <ControlDeck
        departureMode={departureMode}
        onChangeDepartureMode={setDepartureMode}
        selectedGateway={selectedGateway}
        onChangeGateway={setSelectedGateway}
        selectedStation={selectedStation}
        onChangeStation={setSelectedStation}
        shipCoords={shipCoords}
        onAcquireShipGps={handleAcquireShipGps}
        onManualCoordsChange={coords => {setShipCoords(coords); fetch(getApiUrl()+'/api/v1/vessel/update-fix',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vessel_imo:vesselImo,lat:coords[0],lon:coords[1]})}).catch(()=>setErrorMsg('Could not save the waypoint to the backend; coordinates remain in this browser.'));}}
        forecastHours={forecastHours}
        onChangeForecastHours={setForecastHours}
        vesselIceClass={vesselIceClass}
        onChangeVesselIceClass={setVesselIceClass}
        safetyBufferKm={safetyBufferKm}
        onChangeSafetyBufferKm={setSafetyBufferKm}
        cruisingSpeed={cruisingSpeed}
        onChangeCruisingSpeed={setCruisingSpeed}
        onRecalculate={() => { fetchRoute(); fetchAuxiliaryLayers(); }}
        loading={loading}
      />

      {/* Comprehensive Risk & Audit Report Modal */}
      <RouteComparisonModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        routeMetrics={routeMetrics}
        vesselIceClass={vesselIceClass}
        waypoints={waypoints}
        origin={{ name: originLabel, lat: originCoords.lat, lon: originCoords.lon }}
        destination={{ name: destLabel, lat: destinationCoords.lat, lon: destinationCoords.lon }}
        cruisingSpeed={cruisingSpeed}
        icebergsPredicted={icebergsPredicted}
        forecastHours={forecastHours}
        onExportPDF={handleExportPDF}
      />
    </div>
  );
}
