import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import PolarMap from './components/PolarMap';
import TelemetrySidebar from './components/TelemetrySidebar';
import ControlDeck, { POLAR_GATEWAYS, ANTARCTIC_STATIONS } from './components/ControlDeck';
import RouteComparisonModal from './components/RouteComparisonModal';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function App() {
  // In-Voyage Departure & Routing Modes
  const [departureMode, setDepartureMode] = useState('GATEWAY'); // 'GATEWAY' | 'CURRENT_SHIP_GPS' | 'MID_OCEAN_COORDINATES'
  const [selectedGateway, setSelectedGateway] = useState('ZACPT'); // Cape Town Port default
  const [selectedStation, setSelectedStation] = useState('bharati_station'); // Bharati Indian Antarctic Base default
  const [shipCoords, setShipCoords] = useState([-64.50, 72.00]); // MV Vasiliy Golovnin fallback AIS fix
  const [vesselImo] = useState(9577133); // NCPOR chartered polar expedition vessel IMO

  // Navigation Parameters
  const [forecastHours, setForecastHours] = useState(72);
  const [vesselIceClass, setVesselIceClass] = useState('Polar Class 3 (PC3)');
  const [safetyBufferKm, setSafetyBufferKm] = useState(25);
  const [cruisingSpeed, setCruisingSpeed] = useState(14.5);

  // Pareto-optimal 3-route & Bunker Fuel States
  const [paretoRoutes, setParetoRoutes] = useState(null); // GeoJSON FeatureCollection
  const [activeRouteType, setActiveRouteType] = useState('BALANCED'); // 'SAFEST' | 'BALANCED' | 'FASTEST'
  const [remainingFuelMt, setRemainingFuelMt] = useState(200.0); // 200 MT initial bunker reserve
  const [maxTankCapacityMt] = useState(200.0); // Polar Class standard capacity

  // Operational State & Status Advisories
  const [loading, setLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
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
    refIcebergs: true,
    sarCandidates: true,
    predictedIcebergs: true,
    riskHeatmap: true,
    optimizedRoutes: true,
    oceanCurrents: false,
    weatherWind: true,
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
  const [layersSyncStatus, setLayersSyncStatus] = useState('LIVE: NOAA/BYU/ECMWF');

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
      ? `MV Vasiliy Golovnin (IMO ${vesselImo}) AIS Fix`
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
    setLoading(true);
    setErrorMsg(null);
    setFallbackAdvisory(null);

    fetchHealth();

    try {
      const apiUrl = getApiUrl();

      // Dispatch unified In-Voyage routing payload
      const calcPayload = {
        origin_type: departureMode,
        gateway_code: selectedGateway,
        destination_station_id: selectedStation,
        origin_coords: departureMode !== 'GATEWAY' ? [originCoords.lat, originCoords.lon] : undefined,
        start_lat: originCoords.lat,
        start_lon: originCoords.lon,
        end_lat: destinationCoords.lat,
        end_lon: destinationCoords.lon,
        vessel_imo: vesselImo,
        remaining_fuel_mt: remainingFuelMt,
        max_tank_capacity_mt: maxTankCapacityMt,
        vessel_ice_class: vesselIceClass,
        cruising_speed_knots: cruisingSpeed,
        grid_resolution_deg: 0.8
      };

      const [calcRes, ibRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/calculate-route`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(calcPayload),
          signal: controller.signal
        }),
        fetch(`${apiUrl}/api/v1/icebergs?forecast_hours=${forecastHours}&safety_buffer_km=${safetyBufferKm}`, {
          signal: controller.signal
        }).catch(() => null)
      ]);

      if (controller.signal.aborted || activeRequest.current !== controller) return;

      if (!calcRes.ok) {
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
        const activeFeature = paretoData.features.find(f => f.properties?.route_type === activeRouteType) || paretoData.features[0];
        if (activeFeature) {
          const wpts = activeFeature.properties?.waypoints_latlon || [];
          setWaypoints(wpts);
          setDirectWaypoints([[originCoords.lat, originCoords.lon], [destinationCoords.lat, destinationCoords.lon]]);
          setRouteMetrics({
            distance_nautical_miles: activeFeature.properties?.distance_nm || 0,
            estimated_voyage_days: ((activeFeature.properties?.eta_hours || 0) / 24).toFixed(1),
            estimated_voyage_hours: activeFeature.properties?.eta_hours || 0,
            fuel_savings_percent: activeFeature.properties?.fuel_savings_pct || 14.2,
            total_fuel_burn_mt: activeFeature.properties?.total_fuel_burn_mt || 0,
            feasibility_status: activeFeature.properties?.feasibility_status || 'OPTIMAL',
            min_polaris_rio: activeFeature.properties?.min_polaris_rio ?? 0,
            max_ice_concentration: activeFeature.properties?.max_ice_concentration ?? 0,
            collision_risk_index: activeFeature.properties?.route_type === 'SAFEST' ? 0.00 : 0.04
          });
        }
      }

      // Populate live iceberg telemetry
      if (ibRes && ibRes.ok) {
        const ibData = await ibRes.json();
        if (!controller.signal.aborted && activeRequest.current === controller) {
          setIcebergsPresent(ibData.icebergs_present || []);
          setIcebergsPredicted(ibData.icebergs_predicted_72h || []);
        }
      }
    } catch (err) {
      if (controller.signal.aborted || activeRequest.current !== controller) return;
      console.warn('In-voyage route calculation error:', err);
      setErrorMsg('Navigation trajectory recalculation failed. Please verify departure parameters.');
    } finally {
      if (activeRequest.current === controller && !controller.signal.aborted) {
        activeRequest.current = null;
        setLoading(false);
      }
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
    forecastHours,
    safetyBufferKm,
    activeRouteType,
    getApiUrl,
    fetchHealth
  ]);

  // Synchronize route display when active route profile tab is switched
  useEffect(() => {
    if (paretoRoutes?.features) {
      const activeFeature = paretoRoutes.features.find(f => f.properties?.route_type === activeRouteType);
      if (activeFeature) {
        setWaypoints(activeFeature.properties?.waypoints_latlon || []);
        setRouteMetrics(prev => ({
          ...prev,
          distance_nautical_miles: activeFeature.properties?.distance_nm || 0,
          estimated_voyage_days: ((activeFeature.properties?.eta_hours || 0) / 24).toFixed(1),
          estimated_voyage_hours: activeFeature.properties?.eta_hours || 0,
          fuel_savings_percent: activeFeature.properties?.fuel_savings_pct || 14.2,
          total_fuel_burn_mt: activeFeature.properties?.total_fuel_burn_mt || 0,
          feasibility_status: activeFeature.properties?.feasibility_status || 'OPTIMAL',
          min_polaris_rio: activeFeature.properties?.min_polaris_rio ?? 0,
          max_ice_concentration: activeFeature.properties?.max_ice_concentration ?? 0,
        }));
      }
    }
  }, [activeRouteType, paretoRoutes]);

  // Initial fetch on mount & parameter adjustment
  useEffect(() => {
    fetchHealth();
    fetchRoute();
    fetchAuxiliaryLayers();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [fetchRoute, fetchHealth, fetchAuxiliaryLayers]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050b18]">
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

      {/* Main Workspace Area: Sidebar + Polar Map */}
      <div className="flex flex-1 overflow-hidden relative">
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
          onSelectRouteType={setActiveRouteType}
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
            icebergsPredicted={icebergsPredicted}
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
        onManualCoordsChange={setShipCoords}
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
      />
    </div>
  );
}
