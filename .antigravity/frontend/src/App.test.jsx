import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import Navbar from './components/Navbar';

// Exercise App's real hooks while isolating map/network rendering.
vi.mock('./components/PolarMap', () => ({ default: (props) => <map {...props} /> }));
vi.mock('./components/panels/LeftControls', () => ({ default: (props) => <controls {...props} /> }));

let app;
let requests;
const controls = () => app.root.findByType('controls').props;
const navbar = () => app.root.findByType(Navbar).props;
const mount = async () => { await act(async () => { app = create(<App />); }); };
const finish = async (index, data = {}) => {
  await act(async () => {
    requests[index].resolve({ ok: true, json: async () => ({
      waypoints: [[-34, 18], [-69, 76]], ...data,
      route_metrics: {
        distance_nautical_miles: 1234, distance_km: 2285.4, direct_distance_nm: 1200,
        estimated_voyage_hours: 100, estimated_voyage_days: 4.17,
        fuel_consumption_tons: 150, fuel_savings_percent: 4.5,
        risk_score: 12, risk_rating: 'LOW', direct_route_collision_hazards: [],
        ...data.route_metrics
      }
    }) });
  });
};

beforeEach(() => {
  requests = [];
  vi.stubGlobal('fetch', vi.fn((url, options) => new Promise((resolve, reject) => {
    // Deliberately allow aborted requests to resolve: verify stale-result guards too.
    requests.push({ url, signal: options.signal, resolve, reject });
  })));
});

afterEach(async () => {
  if (app) await act(async () => app.unmount());
  app = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('route request lifecycle', () => {
  it('does not refetch after loading, response, layer or analytics rerenders', async () => {
    await mount();
    expect(requests).toHaveLength(1);
    await finish(0, { waypoints: [[-34, 18], [-69, 76]] });
    await act(async () => controls().onToggleLayer('showSeaIce'));
    await act(async () => navbar().onOpenReport());
    expect(requests).toHaveLength(1);
    expect(navbar().loading).toBe(false);
  });

  it('refetches for every changed route parameter, but not equal coordinate objects', async () => {
    await mount();
    const changes = [
      ['onChangeForecastHours', 24, 'forecast_hours', '24'],
      ['onChangeSafetyBufferKm', 30, 'safety_buffer_km', '30'],
      ['onChangeVesselIceClass', 'Polar Class 1 (PC1)', 'vessel_ice_class', 'Polar Class 1 (PC1)'],
      ['onChangeCruisingSpeed', 18, 'cruising_speed_knots', '18'],
      ['onSelectPreset', 'hobart_to_casey', 'end_lon', '110.5283'],
      ['onChangeOriginOverride', { lat: 18.94, lon: 72.82 }, 'start_lat', '18.94'],
    ];
    for (const [callback, value, key, expected] of changes) {
      const previous = requests.length;
      await act(async () => controls()[callback](value));
      expect(requests).toHaveLength(previous + 1);
      expect(requests[previous - 1].signal.aborted).toBe(true);
      expect(new URL(requests.at(-1).url).searchParams.get(key)).toBe(expected);
    }
    await act(async () => controls().onChangeOriginOverride({ lat: 18.94, lon: 72.82 }));
    expect(requests).toHaveLength(7);
  });

  it('supports manual refresh and ignores an older response after the latest completes', async () => {
    await mount();
    await act(async () => { void navbar().onRefresh(); });
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    await finish(1, { waypoints: [[1, 2], [3, 4]], route_metrics: { marker: 'latest' } });
    await finish(0, { waypoints: [[9, 9], [8, 8]], route_metrics: { marker: 'old' } });
    expect(app.root.findByType('map').props.waypoints).toEqual([[1, 2], [3, 4]]);
    expect(navbar().loading).toBe(false);
    expect(requests).toHaveLength(2);
  });

  it('does not let stale completion clear the current loading state', async () => {
    await mount();
    await act(async () => controls().onChangeForecastHours(48));
    await finish(0);
    expect(navbar().loading).toBe(true);
    await finish(1);
    expect(navbar().loading).toBe(false);
  });

  it('stops after a network failure and permits an explicit retry', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    await act(async () => requests[0].reject(new Error('offline')));
    expect(requests).toHaveLength(1);
    expect(navbar().loading).toBe(false);
    await act(async () => { void controls().onRecalculate(); });
    expect(requests).toHaveLength(2);
  });

  it('aborts on unmount and starts a fresh request on remount', async () => {
    await mount();
    await act(async () => app.unmount());
    expect(requests[0].signal.aborted).toBe(true);
    await mount();
    await finish(0);
    expect(navbar().loading).toBe(true);
    await finish(1);
    expect(requests).toHaveLength(2);
    expect(navbar().loading).toBe(false);
  });
});


describe('visible failure and empty result states', () => {
  const text = () => JSON.stringify(app.toJSON());

  it('explains unsupported planning settings without showing route results', async () => {
    await mount();
    await act(async () => requests[0].resolve({ ok: false, status: 422 }));
    expect(text()).toContain('Unsupported route settings.');
    expect(text()).toContain('No route results available.');
    expect(navbar().loading).toBe(false);
  });

  it('shows loading/empty telemetry instead of samples, and Retry recovers', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    expect(text()).toContain('Calculating route');
    expect(text()).not.toContain('3389.8');
    await act(async () => requests[0].reject(new Error('offline')));
    expect(app.root.findByProps({ role: 'alert' }).findByType('p').children.join('')).toBe('Unable to calculate the route. Please try again.');
    expect(text()).toContain('No route results available.');
    await act(async () => navbar().onOpenReport());
    expect(text()).toContain('Route analytics unavailable');
    expect(text()).not.toContain('100% Cleared');
    await act(async () => { void app.root.findByProps({ role: 'alert' }).findByType('button').props.onClick(); });
    expect(app.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(requests).toHaveLength(2);
    await finish(1);
    expect(text()).toContain('Route Overview');
    expect(text()).not.toContain('No route results available.');
  });

  it('clears prior route, hazards and analytics before a recalculation that fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    await finish(0, {
      direct_baseline_waypoints: [[-34, 18], [-69, 76]],
      icebergs_present: [{ id: 'present' }], icebergs_predicted_72h: [{ id: 'predicted' }]
    });
    await act(async () => navbar().onOpenReport());
    await act(async () => controls().onChangeForecastHours(24));
    const map = app.root.findByType('map').props;
    expect(map.waypoints).toEqual([]);
    expect(map.directWaypoints).toEqual([]);
    expect(map.icebergsPresent).toEqual([]);
    expect(map.icebergsPredicted).toEqual([]);
    expect(map.routeMetrics).toBeNull();
    expect(text()).toContain('Route analytics unavailable');
    await act(async () => requests[1].resolve({ ok: false, status: 503 }));
    expect(app.root.findAllByProps({ role: 'alert' })).toHaveLength(1);
    expect(text()).not.toContain('Route Overview');
  });

  it.each(['invalid JSON', 'missing results', 'partial metrics', 'invalid waypoint', 'non-array overlay'])('handles %s without displaying fabricated results', async (failure) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    await act(async () => requests[0].resolve({
      ok: true,
      json: async () => {
        if (failure === 'invalid JSON') throw new SyntaxError('invalid JSON');
        if (failure === 'partial metrics') return { waypoints: [[-34, 18], [-35, 19]], route_metrics: { distance_nautical_miles: 1234 } };
        if (failure === 'invalid waypoint') return { waypoints: [[-34, 18], ['invalid', 19]] };
        if (failure === 'non-array overlay') return {
          waypoints: [[-34, 18], [-35, 19]], icebergs_present: {},
          route_metrics: { distance_nautical_miles: 1, distance_km: 1.852, estimated_voyage_hours: 1, fuel_consumption_tons: 1, risk_score: 1 }
        };
        return {};
      }
    }));
    expect(app.root.findAllByProps({ role: 'alert' })).toHaveLength(1);
    expect(app.root.findByType('map').props.routeMetrics).toBeNull();
    expect(navbar().loading).toBe(false);
    expect(requests).toHaveLength(1);
  });

  it('does not show an error when a superseded request rejects', async () => {
    await mount();
    await act(async () => controls().onChangeForecastHours(24));
    await act(async () => requests[0].reject(new Error('aborted old request')));
    expect(app.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(navbar().loading).toBe(true);
    await finish(1);
    expect(app.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
  });
});


describe('no-route outcome', () => {
  const noRoute = () => ({ ok: false, status: 409, json: async () => ({ detail: { code: 'NO_ROUTE_FOUND' } }) });

  it('displays a specific no-route message with no success results and can recover', async () => {
    await mount();
    await finish(0);
    await act(async () => controls().onSelectPreset('hobart_to_casey'));
    await act(async () => requests[1].resolve(noRoute()));
    expect(app.root.findByProps({ role: 'alert' }).findByType('p').children.join('')).toContain('No route found for the selected endpoints and planning settings.');
    expect(app.root.findByType('map').props.waypoints).toEqual([]);
    expect(app.root.findByType('map').props.routeMetrics).toBeNull();
    expect(navbar().loading).toBe(false);
    await act(async () => navbar().onOpenReport());
    expect(JSON.stringify(app.toJSON())).toContain('Route analytics unavailable');
    await act(async () => { void app.root.findByProps({ role: 'alert' }).findByType('button').props.onClick(); });
    await finish(2);
    expect(app.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(app.root.findByType('map').props.waypoints.length).toBeGreaterThan(1);
  });

  it('does not display a superseded no-route response', async () => {
    await mount();
    await act(async () => controls().onChangeForecastHours(24));
    await finish(1);
    await act(async () => requests[0].resolve(noRoute()));
    expect(app.root.findAllByProps({ role: 'alert' })).toHaveLength(0);
    expect(app.root.findByType('map').props.waypoints.length).toBeGreaterThan(1);
  });

  it('does not classify other HTTP 409 errors as no-route', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    await act(async () => requests[0].resolve({ ok: false, status: 409, json: async () => ({ detail: { code: 'OTHER_ERROR' } }) }));
    expect(app.root.findByProps({ role: 'alert' }).findByType('p').children.join('')).toBe('Unable to calculate the route. Please try again.');
  });
});


describe('redesigned dashboard regressions', () => {
  const text = () => JSON.stringify(app.toJSON());

  it('does not refetch as the App clock ticks, while loading or after success', async () => {
    vi.useFakeTimers();
    await mount();
    const initialClock = text();
    await act(async () => vi.advanceTimersByTime(5000));
    expect(text()).not.toBe(initialClock);
    expect(requests).toHaveLength(1);
    await finish(0);
    await act(async () => vi.advanceTimersByTime(5000));
    expect(requests).toHaveLength(1);
    await act(async () => app.unmount());
    app = null;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves explanation/chart on success and removes both, metrics and alerts on refresh', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await mount();
    expect(text()).toContain('CALCULATING');
    expect(text()).not.toContain('A* SAFE NAV ACTIVE');
    await finish(0, {
      xai_explanation: {
        primary_routing_driver: 'Latest route explanation',
        route_modifiers: { max_sea_ice_penalty_pct: 12, iceberg_proximity_caution: 0 },
        waypoint_explanations: [{ lat: -34, lon: 18, decision_factors: { sic_value: 0, ice_penalty_applied: 1, wind_spd_kts: 10, ocean_current_spd_kts: 1 } }]
      },
      icebergs_predicted_72h: [{ id: 'forecast', snapshots: { '0h': { speed_knots: 0.7 }, '72h': { speed_knots: 1.2 } } }]
    });
    expect(text()).toContain('Latest route explanation');
    expect(text()).toContain('Avg Drift Speed (kts)');
    expect(text()).toContain('ROUTE RESULTS AVAILABLE');
    const explanationButton = app.root.findAllByType('button').find(button => button.children.join('').includes('View detailed explanation'));
    await act(async () => explanationButton.props.onClick());
    expect(text()).toContain('Waypoint Decisions (Sampled)');
    await act(async () => { void controls().onRecalculate(); });
    expect(text()).not.toContain('Latest route explanation');
    expect(text()).not.toContain('Waypoint Decisions (Sampled)');
    expect(text()).not.toContain('Avg Drift Speed (kts)');
    expect(text()).not.toContain('Weather condition change');
    await act(async () => requests[1].reject(new Error('offline')));
    expect(text()).toContain('NO ROUTE RESULTS');
    expect(text()).not.toContain('using local fallback');
    expect(requests).toHaveLength(2);
  });

  it('ignores a stale result even when its JSON parsing completes after a newer result', async () => {
    await mount();
    let resolveJson;
    const json = new Promise(resolve => { resolveJson = resolve; });
    await act(async () => requests[0].resolve({ ok: true, json: () => json }));
    await act(async () => { void controls().onRecalculate(); });
    await finish(1, { xai_explanation: { primary_routing_driver: 'New explanation', waypoint_explanations: [] } });
    await act(async () => resolveJson({ waypoints: [[0, 0], [1, 1]], xai_explanation: { primary_routing_driver: 'Old explanation' } }));
    expect(text()).toContain('New explanation');
    expect(text()).not.toContain('Old explanation');
    expect(app.root.findByType('map').props.waypoints).toEqual([[-34, 18], [-69, 76]]);
    expect(navbar().loading).toBe(false);
  });
});
