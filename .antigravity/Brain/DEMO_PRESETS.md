# Preset passages

Current as of 27 September 2026. Active engine: observed_routes.py, not demo_passages.py.

| Gateway | Departure |
|---|---|
| ZACPT | Cape Town, South Africa |
| USH | Ushuaia, Argentina |
| CLPUQ | Punta Arenas, Chile |
| AUHBT | Hobart, Tasmania |
| NZLYT | Christchurch / Lyttelton, New Zealand |

| Station ID | Destination |
|---|---|
| bharati_station | Bharati, India |
| maitri_station | Maitri, India |
| mcmurdo_station | McMurdo, USA |
| rothera_station | Rothera, UK |

Location metadata is in backend/data/locations.json and UI controls. Actual preset endpoints are first points of APPROACH_CHAINS in observed_routes.py: offshore planning approaches, not harbour entry or station shore transfer. Map markers use returned endpoint metadata.

The authenticated observation suite checks all 20 pairs with three default PC3 profiles and validates segments. This does not guarantee every class/buffer/horizon succeeds or every passage is fuel-feasible. PC3 versus PC5 at McMurdo is an explicit restriction regression. Custom coordinates are validated and connected to the finite graph; on-land coordinates are not silently shifted.

Defaults: Cape Town–Bharati, PC3, 14.5 kn, +72 h, 25 km, 450/500 t fuel, 12 t/day reference burn at 12 kn and 15% reserve. See [implementation](CURRENT_IMPLEMENTATION.md) and [testing](TESTING.md).

The [archived preset document](archive/before-2026-09-27-reconciliation/DEMO_PRESETS.md) preserves simulation-era decisions. Those fixtures are not the active dataset.
