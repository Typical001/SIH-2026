import React from 'react';
import { act, create } from 'react-test-renderer';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LeftControls from './panels/LeftControls';
import DecisionSupport from './panels/DecisionSupport';
import RouteComparisonModal from './RouteComparisonModal';
import PolarMap from './PolarMap';
import Navbar from './Navbar';

vi.mock('leaflet', () => ({ default: { divIcon: vi.fn(), latLngBounds: vi.fn() } }));
vi.mock('react-leaflet', () => ({
  MapContainer: p => <map-container {...p} />,
  TileLayer: p => <tile-layer {...p} />,
  Polyline: p => <map-line {...p} />,
  Circle: p => <map-circle {...p} />,
  Marker: p => <map-marker {...p} />,
  Popup: p => <map-popup {...p} />,
  Tooltip: p => <map-tooltip {...p} />,
  useMap: () => ({ fitBounds: vi.fn() })
}));
let tree;
const render = node => act(() => { tree = create(node); });
const text = () => JSON.stringify(tree.toJSON());
const content = node => typeof node === 'string' ? node : (node.children || []).map(content).join('');
const metrics = { distance_km: 185.2, distance_nautical_miles: 100, direct_distance_nm: 0,
  estimated_voyage_hours: 47.6, fuel_consumption_tons: 0, fuel_savings_percent: 0,
  risk_score: 0, direct_route_collision_hazards: [] };
beforeEach(() => vi.stubGlobal('document', { addEventListener: vi.fn(), removeEventListener: vi.fn(), getElementById: vi.fn() }));
afterEach(() => { if (tree) act(() => tree.unmount()); vi.unstubAllGlobals(); });

it('shows actual preset departure/destination and all three hour horizons', () => {
  const onChangeForecastHours = vi.fn();
  render(<LeftControls selectedPreset="hobart_to_casey" layers={{}} forecastHours={72} onChangeForecastHours={onChangeForecastHours} />);
  expect(tree.root.findByProps({ 'aria-label': 'Departure port' }).props.value).toBe('Hobart');
  const horizon = tree.root.findByProps({ 'aria-label': 'Forecast horizon' });
  expect(horizon.findAllByType('option').map(content)).toEqual(['Next 24 Hours', 'Next 48 Hours', 'Next 72 Hours']);
  for (const hours of [24, 48, 72]) {
    act(() => horizon.props.onChange({ target: { value: String(hours) } }));
    expect(onChangeForecastHours).toHaveBeenLastCalledWith(hours);
  }
  expect(tree.root.findByProps({ 'aria-label': 'Destination station' }).findAllByType('option').map(content)).toEqual(['Bharati Station', 'Maitri Station', 'Casey Station']);
  expect(tree.root.findAllByType('input').find(i => i.props.disabled).props.checked).toBe(false);
});

it('supports keyboard-clickable port selection and reset without losing the selected name', () => {
  const onChangeOriginOverride = vi.fn();
  render(<LeftControls selectedPreset="cape_town_to_bharati" layers={{}} originOverride={{ lat: 18.94, lon: 72.82 }} onChangeOriginOverride={onChangeOriginOverride} />);
  expect(tree.root.findByProps({ 'aria-label': 'Departure port' }).props.value).toBe('Mumbai Port');
  act(() => tree.root.findByProps({ 'aria-label': 'Reset to preset departure' }).props.onClick({ stopPropagation() {} }));
  expect(onChangeOriginOverride).toHaveBeenLastCalledWith(null);
  act(() => tree.root.findByProps({ 'aria-label': 'Departure port' }).props.onFocus());
  act(() => tree.root.findAllByType('button').find(b => content(b) === 'Cochin / Kochi').props.onClick());
  expect(onChangeOriginOverride).toHaveBeenLastCalledWith({ lat: 9.96, lon: 76.23, name: 'Cochin / Kochi' });
});

it.each([0, 45, 80])('shows model risk and duration rollover without invented comparisons or alerts (%s)', risk => {
  render(<DecisionSupport routeMetrics={{ ...metrics, risk_score: risk }} forecastHours={24} />);
  expect(text()).toContain('2d 0h');
  expect(text()).not.toContain('1d 24h');
  expect(text()).toContain('0 km');
  expect(text()).toContain('Time unavailable');
  expect(text()).not.toContain('Shortest');
  expect(text()).not.toContain('Weather condition change');
  expect(text()).toContain('No baseline hazard intersections reported.');
  const color = risk < 30 ? 'emerald' : risk < 60 ? 'amber' : 'red';
  expect(text()).toContain(`bg-${color}-950/50 border-${color}-500/30 text-${color}-400`);
});

it('retains zero values in analytics and leaves unavailable baseline figures empty', () => {
  render(<RouteComparisonModal isOpen routeMetrics={metrics} />);
  const rows = tree.root.findAllByType('tr').map(content);
  expect(rows).toContain('Reported hazard intersectionsRoute clearance not verified0');
  expect(rows).toContain('Modeled fuel consumption0.0 tUnavailable');
  expect(rows).toContain('Distance100.0 NM0.0 NM');
  expect(text()).not.toMatch(/100%|465|92\.4|9\.5 Days|COMPLIANT/);
});

it('shows supplied baseline metrics, negative savings and forecast coverage gaps', () => {
  const current = { ...metrics, direct_fuel_consumption_tons: 20, direct_estimated_voyage_hours: 48,
    fuel_savings_percent: -20.3, forecast_covers_voyage: false, forecast_hours: 24,
    uncovered_voyage_hours: 23.6, baseline_is_navigable: false };
  render(<RouteComparisonModal isOpen routeMetrics={current} />);
  const rows = tree.root.findAllByType('tr').map(content);
  expect(rows).toContain('Modeled fuel consumption0.0 t20.0 t');
  expect(rows).toContain('Estimated voyage time2d 0h2d 0h');
  expect(content(tree.root)).toContain('-20.3%');
  expect(content(tree.root)).toContain('forecast by 23.6h');
  expect(content(tree.root)).toContain('hypothetical comparisons');
  act(() => tree.update(<DecisionSupport routeMetrics={current} forecastHours={24} />));
  expect(content(tree.root)).toContain('Later iceberg positions are unknown.');
  expect(content(tree.root)).toContain('Direct baseline fails');
});

it('renders the planning envelope rather than only the final iceberg radius', () => {
  render(<PolarMap icebergsPredicted={[{ id: 'swept', lat: -50, lon: 1, safety_radius_km: 25, planning_hazard_radius_km: 60 }]} layers={{ showHazardBuffers: true }} />);
  expect(tree.root.findByType('map-circle').props.radius).toBe(60000);
});

it('leaves gaps for missing forecast samples instead of plotting zero speed', () => {
  render(<DecisionSupport routeMetrics={metrics} forecastHours={72} icebergsPredicted={[{ snapshots: { '0h': { speed_knots: 0 }, '72h': { speed_knots: 2 } } }]} />);
  const chart = tree.root.findByProps({ viewBox: '0 0 200 60' });
  expect(chart.findAllByType('circle')).toHaveLength(2);
  expect(chart.findAllByType('polyline')).toHaveLength(0);
});

const iceberg = { id: 'curve', lat: 2, lon: 3, initial_lat: 0, initial_lon: 0, safety_radius_km: 25,
  trajectory_points: [{ lat: 0, lon: 0 }, { lat: 3, lon: 1 }, { lat: 2, lon: 3 }] };
it.each([[false, true, true], [true, false, false], [false, false, true], [false, true, false]])('renders forecast layers independently: markers %s, buffers %s, trails %s', (markers, buffers, trails) => {
  render(<PolarMap origin={null} destination={null} icebergsPredicted={[iceberg]} layers={{ showPredictedBergs: markers, showHazardBuffers: buffers, showDriftVectors: trails }} forecastHours={24} />);
  expect(tree.root.findAllByType('map-marker')).toHaveLength(Number(markers));
  expect(tree.root.findAllByType('map-circle')).toHaveLength(Number(buffers));
  expect(tree.root.findAllByType('map-line')).toHaveLength(Number(trails));
  if (trails) expect(tree.root.findByType('map-line').props.positions).toEqual([[0, 0], [3, 1], [2, 3]]);
  if (markers) expect(content(tree.root)).toContain('+24h PREDICTED');
  expect(content(tree.root)).not.toContain('72h Predicted Iceberg');
});

it('uses current names and coordinates in endpoint popups', () => {
  render(<PolarMap origin={{ name: 'Mumbai', lat: 18.94, lon: 72.82 }} destination={{ name: 'Casey', lat: -66.28, lon: 110.53 }} layers={{}} />);
  expect(content(tree.root)).toContain('Mumbai (18.94°, 72.82°)');
  expect(content(tree.root)).toContain('Casey (-66.28°, 110.53°)');
  expect(text()).not.toMatch(/Cape Town|Bharati|Collision-Free/);
});

it('connects navbar shortcuts to the controls and analytics', () => {
  const focus = vi.fn(), scrollIntoView = vi.fn(), onOpenReport = vi.fn();
  document.getElementById.mockReturnValue({ focus, scrollIntoView });
  render(<Navbar onOpenReport={onOpenReport} />);
  for (const label of ['Route Planner', 'Forecast', 'Analytics']) act(() => tree.root.findAllByType('button').find(b => content(b) === label).props.onClick());
  expect(document.getElementById.mock.calls).toEqual([['route-planning'], ['iceberg-forecast']]);
  expect(focus).toHaveBeenCalledTimes(2);
  expect(onOpenReport).toHaveBeenCalledOnce();
});
