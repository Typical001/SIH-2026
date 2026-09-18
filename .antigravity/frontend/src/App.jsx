import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import LeftControls from './components/panels/LeftControls';
import DecisionSupport from './components/panels/DecisionSupport';
import BottomStatusBar from './components/panels/BottomStatusBar';
import MapArea from './components/panels/MapArea';
import RouteComparisonModal from './components/RouteComparisonModal';

// Preset Geographic Coordinates
const PRESET_COORDINATES = {
  cape_town_to_bharati: {
    name: 'Cape Town ➔ Bharati Station (Larsemann Hills)',
    origin: { lat: -33.9249, lon: 18.4241, name: 'Cape Town' },
    destination: { lat: -69.4125, lon: 76.1872, name: 'Bharati Station' }
  },
  cape_town_to_maitri: {
    name: 'Cape Town ➔ Maitri Station (Schirmacher Oasis)',
    origin: { lat: -33.9249, lon: 18.4241, name: 'Cape Town' },
    destination: { lat: -70.7667, lon: 11.7333, name: 'Maitri Station' }
  },
  hobart_to_casey: {
    name: 'Hobart ➔ Casey Station (Wilkes Land)',
    origin: { lat: -42.8821, lon: 147.3272, name: 'Hobart' },
    destination: { lat: -66.2822, lon: 110.5283, name: 'Casey Station' }
  }
};

export default function App() {
  const [selectedPreset, setSelectedPreset] = useState('cape_town_to_bharati');
  const [forecastHours, setForecastHours] = useState(72);
  const [vesselIceClass, setVesselIceClass] = useState('Polar Class 3 (PC3)');
  const [safetyBufferKm, setSafetyBufferKm] = useState(25);
  const [cruisingSpeed, setCruisingSpeed] = useState(14.5);
  // null = use preset origin; { lat, lon } = user-defined Indian port or custom coords
  const [originOverride, setOriginOverride] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const activeRequest = useRef(null);

  // Route & Metocean Data
  const [waypoints, setWaypoints] = useState([]);
  const [directWaypoints, setDirectWaypoints] = useState([]);
  const [icebergsPresent, setIcebergsPresent] = useState([]);
  const [icebergsPredicted, setIcebergsPredicted] = useState([]);
  const [routeMetrics, setRouteMetrics] = useState(null);
  const [xaiExplanation, setXaiExplanation] = useState(null);
  const [metoceanGrid, setMetoceanGrid] = useState([]);

  // Layer Visibility
  const [layers, setLayers] = useState({
    showAStarRoute: true,
    showDirectRoute: true,
    showPredictedBergs: true,
    showPresentBergs: true,
    showHazardBuffers: true,
    showDriftVectors: true,
    showSeaIce: true,
    showMetoceanGrid: false
  });

  const toggleLayer = (layerKey) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  const presetCoords = PRESET_COORDINATES[selectedPreset] || PRESET_COORDINATES.cape_town_to_bharati;
  const currentCoords = {
    ...presetCoords,
    origin: originOverride ?? presetCoords.origin
  };

  // Depend on coordinate values, not the new objects created on each render.
  const startLat = currentCoords.origin.lat;
  const startLon = currentCoords.origin.lon;
  const endLat = currentCoords.destination.lat;
  const endLon = currentCoords.destination.lon;

  // Fetch Route from FastAPI Backend
  const fetchRoute = useCallback(async () => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setErrorMsg(null);
    // Remove previous results while calculating for the current settings.
    setWaypoints([]);
    setDirectWaypoints([]);
    setIcebergsPresent([]);
    setIcebergsPredicted([]);
    setRouteMetrics(null);
    setXaiExplanation(null);

    const query = new URLSearchParams({
      start_lat: startLat.toString(),
      start_lon: startLon.toString(),
      end_lat: endLat.toString(),
      end_lon: endLon.toString(),
      forecast_hours: forecastHours.toString(),
      vessel_ice_class: vesselIceClass,
      safety_buffer_km: safetyBufferKm.toString(),
      cruising_speed_knots: cruisingSpeed.toString()
    });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://polarnav-backend.onrender.com';
      const resp = await fetch(`${apiUrl}/api/v1/polar-route?${query.toString()}`, {
        signal: controller.signal
      });
      if (!resp.ok) {
        if (resp.status === 422) {
          if (controller.signal.aborted || activeRequest.current !== controller) return;
          setErrorMsg('Unsupported route settings. Choose distinct endpoints between 75°S and 25°N without crossing the date line, and check vessel and forecast settings.');
          return;
        }
        if (resp.status === 409) {
          const failure = await resp.json();
          if (controller.signal.aborted || activeRequest.current !== controller) return;
          if (failure?.detail?.code === 'NO_ROUTE_FOUND') {
            setErrorMsg('No route found for the selected endpoints and planning settings. Review your departure and destination, then try again.');
            return;
          }
        }
        throw new Error(`API returned status ${resp.status}`);
      }
      const data = await resp.json();
      // A superseded response must never overwrite the latest route.
      if (controller.signal.aborted || activeRequest.current !== controller) return;

      if (!Array.isArray(data?.waypoints) || data.waypoints.length < 2 ||
          !data.waypoints.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite)) ||
          !['distance_nautical_miles', 'distance_km', 'estimated_voyage_hours', 'fuel_consumption_tons', 'risk_score']
            .every(key => Number.isFinite(data?.route_metrics?.[key])) ||
          ['direct_baseline_waypoints', 'icebergs_present', 'icebergs_predicted_72h']
            .some(key => data[key] != null && !Array.isArray(data[key]))) {
        throw new Error('Route response is missing usable results');
      }

      setWaypoints(data.waypoints || []);
      setDirectWaypoints(data.direct_baseline_waypoints || []);
      setIcebergsPresent(data.icebergs_present || []);
      setIcebergsPredicted(data.icebergs_predicted_72h || []);
      setRouteMetrics(data.route_metrics);
      setXaiExplanation(data.xai_explanation || null);
    } catch (err) {
      if (controller.signal.aborted || activeRequest.current !== controller) return;
      console.warn('Route calculation failed:', err);
      setErrorMsg('Unable to calculate the route. Please try again.');
    } finally {
      if (activeRequest.current === controller && !controller.signal.aborted) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, [startLat, startLon, endLat, endLon, forecastHours, vesselIceClass, safetyBufferKm, cruisingSpeed]);

  // Initial fetch on load & when parameters change
  useEffect(() => {
    fetchRoute();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [fetchRoute]);

  const [timeUtc, setTimeUtc] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050b18]">
      {/* Top Navigation Bar */}
      <Navbar
        loading={loading}
        onRefresh={fetchRoute}
        onOpenReport={() => setIsReportOpen(true)}
        vesselIceClass={vesselIceClass}
        forecastHours={forecastHours}
      />

      {errorMsg && (
        <div role="alert" className="flex items-center justify-between gap-4 border-b border-red-500/40 bg-red-950 px-5 py-3 text-sm text-red-100 shrink-0">
          <p>{errorMsg}</p>
          <button type="button" onClick={fetchRoute} disabled={loading}
            className="rounded border border-red-300/50 px-3 py-1 font-semibold hover:bg-red-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white disabled:opacity-50">
            Retry
          </button>
        </div>
      )}

      {/* Main Workspace Area: 3 Columns */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Route Planning & Controls */}
        <LeftControls
          selectedPreset={selectedPreset}
          onSelectPreset={setSelectedPreset}
          originOverride={originOverride}
          onChangeOriginOverride={setOriginOverride}
          forecastHours={forecastHours}
          onChangeForecastHours={setForecastHours}
          vesselIceClass={vesselIceClass}
          onChangeVesselIceClass={setVesselIceClass}
          safetyBufferKm={safetyBufferKm}
          onChangeSafetyBufferKm={setSafetyBufferKm}
          cruisingSpeed={cruisingSpeed}
          onChangeCruisingSpeed={setCruisingSpeed}
          layers={layers}
          onToggleLayer={toggleLayer}
          onRecalculate={fetchRoute}
          loading={loading}
        />

        {/* Central Map */}
        <MapArea
          forecastHours={forecastHours}
          waypoints={waypoints}
          directWaypoints={directWaypoints}
          icebergsPresent={icebergsPresent}
          icebergsPredicted={icebergsPredicted}
          metoceanGrid={metoceanGrid}
          layers={layers}
          origin={currentCoords.origin}
          destination={currentCoords.destination}
          routeMetrics={routeMetrics}
        />

        {/* Right Sidebar: Decision Support */}
        <DecisionSupport
          routeMetrics={routeMetrics}
          vesselIceClass={vesselIceClass}
          cruisingSpeed={cruisingSpeed}
          loading={loading}
          xaiExplanation={xaiExplanation}
          icebergsPredicted={icebergsPredicted}
          forecastHours={forecastHours}
        />
      </div>

      {/* Bottom Status Bar */}
      <BottomStatusBar timeUtc={timeUtc} loading={loading} hasResults={!!routeMetrics} />

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
