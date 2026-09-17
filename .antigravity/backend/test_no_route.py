"""No-route engine and ASGI HTTP regressions; runs with standard unittest."""
import asyncio
import json
import unittest
from unittest.mock import patch

import networkx as nx

from main import app
from pathfinder import LandMask, NoRouteFoundError, PolarPathfinder


async def request_route():
    """Exercise FastAPI's actual ASGI response without extra HTTP test packages."""
    messages = []
    scope = {
        "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
        "method": "GET", "scheme": "http", "path": "/api/v1/polar-route",
        "raw_path": b"/api/v1/polar-route", "root_path": "",
        "query_string": b"start_lat=-34&start_lon=18&end_lat=-35&end_lon=19&forecast_hours=0",
        "headers": [], "client": ("127.0.0.1", 1), "server": ("test", 80),
    }

    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    async def send(message):
        messages.append(message)

    await app(scope, receive, send)
    status = next(m["status"] for m in messages if m["type"] == "http.response.start")
    body = b"".join(m.get("body", b"") for m in messages if m["type"] == "http.response.body")
    return status, json.loads(body)


class NoRouteTests(unittest.TestCase):
    def test_disconnected_graph_raises_instead_of_fabricating_route(self):
        graph = nx.Graph()
        start, end = (-34, 18), (-35, 19)
        graph.add_nodes_from([start, end])
        engine = PolarPathfinder()
        with patch.object(engine, "build_navigation_graph", return_value=(graph, [start, end], [])):
            with self.assertRaises(NoRouteFoundError) as error:
                engine.calculate_optimal_route(start, end, iceberg_forecasts=[])
        self.assertIsInstance(error.exception.__cause__, nx.NetworkXNoPath)

    def test_missing_endpoint_raises_instead_of_fabricating_route(self):
        engine = PolarPathfinder()
        start, end = (-34, 18), (-35, 19)
        with patch.object(engine, "build_navigation_graph", return_value=(nx.Graph(), [start, end], [])):
            with self.assertRaises(NoRouteFoundError) as error:
                engine.calculate_optimal_route(start, end, iceberg_forecasts=[])
        self.assertIsInstance(error.exception.__cause__, nx.NodeNotFound)

    def test_blocked_grid_has_no_route(self):
        # Real graph construction and A*; simulate a corridor with every grid node blocked.
        with patch.object(LandMask, "is_land", return_value=True):
            with self.assertRaises(NoRouteFoundError):
                PolarPathfinder().calculate_optimal_route((-34, 18), (-35, 19), iceberg_forecasts=[])

    def test_http_no_route_has_409_code_and_no_success_payload(self):
        with patch("main.get_initial_icebergs", return_value=[]), patch.object(LandMask, "is_land", return_value=True):
            status, body = asyncio.run(request_route())
        self.assertEqual(status, 409)
        self.assertEqual(body["detail"]["code"], "NO_ROUTE_FOUND")
        self.assertEqual(set(body), {"detail"})
        for field in ("waypoints", "direct_baseline_waypoints", "route_metrics", "xai_explanation"):
            self.assertNotIn(field, body)

    def test_http_success_still_returns_route_and_metrics(self):
        with patch("main.get_initial_icebergs", return_value=[]):
            status, body = asyncio.run(request_route())
        self.assertEqual(status, 200)
        self.assertGreaterEqual(len(body["waypoints"]), 2)
        self.assertGreater(body["route_metrics"]["distance_nautical_miles"], 0)
        self.assertIn("primary_routing_driver", body["xai_explanation"])
        self.assertGreater(len(body["xai_explanation"]["waypoint_explanations"]), 0)
        self.assertNotIn("detail", body)


if __name__ == "__main__":
    unittest.main()
