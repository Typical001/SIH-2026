import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

// Mock subcomponents
vi.mock('./components/Navbar', () => ({
  default: (props) => <nav data-testid="navbar" {...props} />
}));
vi.mock('./components/PolarMap', () => ({
  default: (props) => <div data-testid="polarmap" {...props} />
}));
vi.mock('./components/TelemetrySidebar', () => ({
  default: (props) => <aside data-testid="sidebar" {...props} />
}));
vi.mock('./components/ControlDeck', () => ({
  default: (props) => <div data-testid="controldeck" {...props} />,
  POLAR_GATEWAYS: [
    { code: 'ZACPT', name: 'Cape Town Port (South Africa)', lat: -33.9249, lon: 18.4241 },
    { code: 'USH',   name: 'Ushuaia Port (Argentina)', lat: -54.8019, lon: -68.3030 },
    { code: 'CLPUQ', name: 'Punta Arenas (Chile)', lat: -53.1638, lon: -70.9171 },
    { code: 'AUHBT', name: 'Hobart Port (Tasmania, Australia)', lat: -42.8821, lon: 147.3272 },
    { code: 'NZLYT', name: 'Christchurch / Lyttelton Port (NZ)', lat: -43.6033, lon: 172.7194 },
  ],
  ANTARCTIC_STATIONS: [
    { id: 'bharati_station', name: 'Bharati Station (India - Prydz Bay)', lat: -69.4125, lon: 76.1872 },
    { id: 'maitri_station',  name: 'Maitri Station (India - Schirmacher Oasis)', lat: -70.7667, lon: 11.7333 },
    { id: 'mcmurdo_station', name: 'McMurdo Station (USA - Ross Island)', lat: -77.8460, lon: 166.6680 },
    { id: 'rothera_station', name: 'Rothera Station (UK - Adelaide Island)', lat: -67.5683, lon: -68.1275 },
  ]
}));
vi.mock('./components/RouteComparisonModal', () => ({
  default: (props) => <div data-testid="modal" {...props} />
}));

let app;
let mockFetch;

beforeEach(() => {
  mockFetch = vi.fn((url, options) => {
    if (url.includes('/api/health')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          status: 'healthy',
          mode: 'ONLINE_LIVE_SATELLITE',
          is_live_satellite: true,
          iceberg_count: 2000
        })
      });
    }
    if (url.includes('/api/v1/layers/')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          geojson: { type: 'FeatureCollection', features: [] },
          overall_sync_label: 'LIVE: NOAA/BYU/ECMWF'
        })
      });
    }
    if (url.includes('/api/v1/calculate-route')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          type: 'FeatureCollection',
          metadata: {
            recommended_route_type: 'BALANCED',
            auto_switched: false
          },
          features: [
            {
              type: 'Feature',
              properties: {
                route_type: 'BALANCED',
                distance_nm: 3393.9,
                eta_hours: 292.94,
                total_fuel_burn_mt: 120.5,
                feasibility_status: 'FEASIBLE',
                flags: []
              },
              geometry: {
                type: 'LineString',
                coordinates: [[18.42, -33.92], [76.18, -69.41]]
              }
            }
          ]
        })
      });
    }
    if (url.includes('/api/v1/vessel/last-fix')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          fix: { lat: -64.50, lon: 72.00, vessel_imo: 9577133 }
        })
      });
    }
    return Promise.resolve({
      ok: true,
      json: async () => ({})
    });
  });

  vi.stubGlobal('fetch', mockFetch);
});

afterEach(async () => {
  if (app) {
    await act(async () => {
      app.unmount();
    });
    app = null;
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('PolarNav App In-Voyage Architecture', () => {
  it('mounts cleanly and renders all ECDIS bridge components', async () => {
    await act(async () => {
      app = create(<App />);
    });
    expect(app.root.findByProps({ 'data-testid': 'navbar' })).toBeDefined();
    expect(app.root.findByProps({ 'data-testid': 'polarmap' })).toBeDefined();
    expect(app.root.findByProps({ 'data-testid': 'sidebar' })).toBeDefined();
    expect(app.root.findByProps({ 'data-testid': 'controldeck' })).toBeDefined();
  });

  it('triggers route calculation on mount with default Cape Town -> Bharati', async () => {
    await act(async () => {
      app = create(<App />);
    });
    const calculateCalls = mockFetch.mock.calls.filter(call => call[0].includes('/api/v1/calculate-route'));
    expect(calculateCalls.length).toBeGreaterThanOrEqual(1);
    const postPayload = JSON.parse(calculateCalls[0][1].body);
    expect(postPayload.origin_type).toBe('GATEWAY');
    expect(postPayload.gateway_code).toBe('ZACPT');
    expect(postPayload.destination_station_id).toBe('bharati_station');
  });

  it('allows switching departure mode to CURRENT_SHIP_GPS', async () => {
    await act(async () => {
      app = create(<App />);
    });
    const controlDeckProps = app.root.findByProps({ 'data-testid': 'controldeck' }).props;
    await act(async () => {
      controlDeckProps.onChangeDepartureMode('CURRENT_SHIP_GPS');
    });
    const updatedProps = app.root.findByProps({ 'data-testid': 'controldeck' }).props;
    expect(updatedProps.departureMode).toBe('CURRENT_SHIP_GPS');
  });

  it('allows selecting different Pareto route profiles (Safest/Balanced/Fastest)', async () => {
    await act(async () => {
      app = create(<App />);
    });
    const sidebarProps = app.root.findByProps({ 'data-testid': 'sidebar' }).props;
    expect(sidebarProps.activeRouteType).toBe('BALANCED');
    await act(async () => {
      sidebarProps.onSelectRouteType('SAFEST');
    });
    const updatedSidebarProps = app.root.findByProps({ 'data-testid': 'sidebar' }).props;
    expect(updatedSidebarProps.activeRouteType).toBe('SAFEST');
  });

  it('displays error alert on network failure and allows retry', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/api/v1/calculate-route')) {
        return Promise.reject(new Error('Network offline'));
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }));

    await act(async () => {
      app = create(<App />);
    });

    const alert = app.root.findByProps({ role: 'alert' });
    expect(alert).toBeDefined();
    expect(alert.findByType('p').children.join('')).toContain('Navigation trajectory recalculation failed');

    // Clicking retry button
    const retryBtn = alert.findByType('button');
    expect(retryBtn).toBeDefined();
  });
});
