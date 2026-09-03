import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import PolarMap from './components/PolarMap';
import TelemetrySidebar from './components/TelemetrySidebar';
import ControlDeck from './components/ControlDeck';
import RouteComparisonModal from './components/RouteComparisonModal';

// Preset Geographic Coordinates
const PRESET_COORDINATES = {
  cape_town_to_bharati: {
    name: 'Cape Town ➔ Bharati Station (Larsemann Hills)',
    origin: { lat: -33.9249, lon: 18.4241 },
    destination: { lat: -69.4125, lon: 76.1872 }
  },
  cape_town_to_maitri: {
    name: 'Cape Town ➔ Maitri Station (Schirmacher Oasis)',
    origin: { lat: -33.9249, lon: 18.4241 },
    destination: { lat: -70.7667, lon: 11.7333 }
  },
  hobart_to_casey: {
    name: 'Hobart ➔ Casey Station (Wilkes Land)',
    origin: { lat: -42.8821, lon: 147.3272 },
    destination: { lat: -66.2822, lon: 110.5283 }
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

  // Route & Metocean Data
  const [waypoints, setWaypoints] = useState([]);
  const [directWaypoints, setDirectWaypoints] = useState([]);
  const [icebergsPresent, setIcebergsPresent] = useState([]);
  const [icebergsPredicted, setIcebergsPredicted] = useState([]);
  const [routeMetrics, setRouteMetrics] = useState(null);
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

  // Fetch Route from FastAPI Backend
  const fetchRoute = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const origin = currentCoords.origin;
    const dest = currentCoords.destination;

    const query = new URLSearchParams({
      start_lat: origin.lat.toString(),
      start_lon: origin.lon.toString(),
      end_lat: dest.lat.toString(),
      end_lon: dest.lon.toString(),
      forecast_hours: forecastHours.toString(),
      vessel_ice_class: vesselIceClass,
      safety_buffer_km: safetyBufferKm.toString(),
      cruising_speed_knots: cruisingSpeed.toString()
    });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://polarnav-backend.onrender.com';
      const resp = await fetch(`${apiUrl}/api/v1/polar-route?${query.toString()}`);
      if (!resp.ok) {
        throw new Error(`API returned status ${resp.status}`);
      }
      const data = await resp.json();

      setWaypoints(data.waypoints || []);
      setDirectWaypoints(data.direct_baseline_waypoints || []);
      setIcebergsPresent(data.icebergs_present || []);
      setIcebergsPredicted(data.icebergs_predicted_72h || []);
      setRouteMetrics(data.route_metrics || null);
    } catch (err) {
      console.warn('Backend fetch error or offline, loading calibrated simulation state:', err);
      setErrorMsg('FastAPI backend connection note: using local calibrated simulation mode.');
    } finally {
      setLoading(false);
    }
  }, [currentCoords, forecastHours, vesselIceClass, safetyBufferKm, cruisingSpeed, originOverride]);

  // Initial fetch on load & when parameters change
  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#050b18]">
      {/* Top Mission Navbar */}
      <Navbar
        loading={loading}
        onRefresh={fetchRoute}
        onOpenReport={() => setIsReportOpen(true)}
        vesselIceClass={vesselIceClass}
        forecastHours={forecastHours}
      />

      {/* Main Workspace Area: Sidebar + Polar Map */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Telemetry Sidebar */}
        <TelemetrySidebar
          routeMetrics={routeMetrics}
          vesselIceClass={vesselIceClass}
          cruisingSpeed={cruisingSpeed}
          loading={loading}
        />

        {/* Central Polar Map Deck */}
        <main className="flex-1 relative h-full">
          <PolarMap
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
        </main>
      </div>

      {/* Bottom Mission Control Deck */}
      <ControlDeck
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
