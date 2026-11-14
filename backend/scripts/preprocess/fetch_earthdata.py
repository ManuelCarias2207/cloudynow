"""Download NASA Earthdata products for the pilot zones.

1. MODIS MOD13Q1 NDVI (250 m, 16-day) through the ORNL DAAC MODIS Web Service.
   Public REST API, no login required. Output: data/raw/ndvi_<zone>.json
2. Optional (--search-granules): list SMAP soil moisture and GPM IMERG granules over each
   zone with `earthaccess`. Requires EARTHDATA_USERNAME / EARTHDATA_PASSWORD in the env.

Usage:
    python fetch_earthdata.py [--start 2022] [--end 2023] [--zones la-union] [--search-granules]
"""
import argparse
import sys
import time

import requests

from _common import RAW_DIR, load_zones, write_json

ORNL_BASE_URL = "https://modis.ornl.gov/rst/api/v1"
NDVI_PRODUCT = "MOD13Q1"
NDVI_BAND = "250m_16_days_NDVI"
MAX_DATES_PER_REQUEST = 4
GRANULE_COLLECTIONS = {
    "smap_soil_moisture": "SPL3SMP_E",
    "gpm_imerg_monthly": "GPM_3IMERGM",
}


def composite_dates(start, end):
    return [f"A{year}{doy:03d}" for year in range(start, end + 1) for doy in range(1, 366, 16)]


def get_json(url, params, retries=3):
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, params=params, headers={"Accept": "application/json"}, timeout=180)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as error:
            print(f"  attempt {attempt} failed: {error}", file=sys.stderr)
            time.sleep(5 * attempt)
    raise RuntimeError(f"Request failed: {url}")


def fetch_ndvi(zone, start, end):
    dates = composite_dates(start, end)
    samples = []
    for i in range(0, len(dates), MAX_DATES_PER_REQUEST):
        chunk = dates[i:i + MAX_DATES_PER_REQUEST]
        payload = get_json(f"{ORNL_BASE_URL}/{NDVI_PRODUCT}/subset", {
            "latitude": zone["lat"],
            "longitude": zone["lon"],
            "band": NDVI_BAND,
            "startDate": chunk[0],
            "endDate": chunk[-1],
            "kmAboveBelow": 0,
            "kmLeftRight": 0,
        })
        scale = float(payload.get("scale", 0.0001))
        for item in payload.get("subset", []):
            raw = item["data"][0]
            if raw <= -3000:
                continue
            samples.append({"date": item["calendar_date"], "ndvi": round(raw * scale, 4)})
        print(f"  {zone['id']}: {len(samples)} NDVI samples")
    return samples


def search_granules(zone, start, end):
    import earthaccess

    earthaccess.login(strategy="environment")
    bbox = (zone["lon"] - 0.1, zone["lat"] - 0.1, zone["lon"] + 0.1, zone["lat"] + 0.1)
    found = {}
    for key, short_name in GRANULE_COLLECTIONS.items():
        results = earthaccess.search_data(
            short_name=short_name,
            bounding_box=bbox,
            temporal=(f"{start}-01-01", f"{end}-12-31"),
        )
        found[key] = {"shortName": short_name, "granules": len(results)}
        print(f"  {zone['id']}: {short_name} -> {len(results)} granules")
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", type=int, default=2022)
    parser.add_argument("--end", type=int, default=2023)
    parser.add_argument("--zones", nargs="*")
    parser.add_argument("--search-granules", action="store_true")
    args = parser.parse_args()

    for zone in load_zones(args.zones):
        print(f"MODIS NDVI -> {zone['id']} ({args.start}-{args.end})")
        write_json(RAW_DIR / f"ndvi_{zone['id']}.json", {
            "zoneId": zone["id"],
            "source": f"MODIS {NDVI_PRODUCT} {NDVI_BAND} via ORNL DAAC MODIS Web Service",
            "start": args.start,
            "end": args.end,
            "samples": fetch_ndvi(zone, args.start, args.end),
        })
        if args.search_granules:
            write_json(RAW_DIR / f"granules_{zone['id']}.json", search_granules(zone, args.start, args.end))


if __name__ == "__main__":
    main()
