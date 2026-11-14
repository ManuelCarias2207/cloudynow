"""Download daily NASA POWER data (agroclimatology community) for every pilot zone.

Output: data/raw/power_<zone>.json

Usage:
    python fetch_nasa_power.py [--start 2014] [--end 2023] [--zones chalatenango morazan]
"""
import argparse
import os
import sys
import time

import requests

from _common import RAW_DIR, load_zones, write_json

POWER_BASE_URL = os.environ.get("NASA_POWER_BASE_URL", "https://power.larc.nasa.gov/api")
PARAMETERS = ["PRECTOTCORR", "T2M", "T2M_MAX", "GWETROOT", "GWETTOP"]


def fetch_zone(zone, start, end, retries=3):
    url = f"{POWER_BASE_URL}/temporal/daily/point"
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "latitude": zone["lat"],
        "longitude": zone["lon"],
        "start": f"{start}0101",
        "end": f"{end}1231",
        "format": "JSON",
    }
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, params=params, timeout=120)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as error:
            print(f"  attempt {attempt} failed: {error}", file=sys.stderr)
            time.sleep(5 * attempt)
    raise RuntimeError(f"NASA POWER request failed for {zone['id']}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", type=int, default=2014)
    parser.add_argument("--end", type=int, default=2023)
    parser.add_argument("--zones", nargs="*")
    args = parser.parse_args()

    for zone in load_zones(args.zones):
        print(f"NASA POWER -> {zone['id']} ({args.start}-{args.end})")
        payload = fetch_zone(zone, args.start, args.end)
        write_json(RAW_DIR / f"power_{zone['id']}.json", {
            "zoneId": zone["id"],
            "source": "NASA POWER daily point API (community=AG)",
            "start": args.start,
            "end": args.end,
            "fillValue": payload.get("header", {}).get("fill_value", -999),
            "parameters": payload["properties"]["parameter"],
        })


if __name__ == "__main__":
    main()
