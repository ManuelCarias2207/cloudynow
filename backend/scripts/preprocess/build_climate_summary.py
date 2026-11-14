"""Build data/climate_summary.json from the raw NASA downloads.

Inputs (from fetch_nasa_power.py / fetch_earthdata.py):
    data/raw/power_<zone>.json   required
    data/raw/ndvi_<zone>.json    optional (without it the bare-field window uses a rainfall proxy)

Usage:
    python build_climate_summary.py
"""
import json
import statistics
from collections import defaultdict
from datetime import date, datetime, timezone

from _common import DATA_DIR, RAW_DIR, load_zones, write_json

DRY_DAY_MM = 1.0
EXTREME_HEAT_C = 35.0
RAINY_SEASON_MONTHS = range(5, 11)
BARE_NDVI_THRESHOLD = 0.45
BARE_RAIN_PROXY_MM = 50.0
ALWAYS_MISSING = [
    {"key": "soil_type", "label": "Local soil type and fertility", "reason": "Not observable from NASA satellite products at farm scale."},
    {"key": "market_prices", "label": "Local market prices", "reason": "Economic data is outside NASA datasets."},
    {"key": "pests", "label": "Pests and diseases", "reason": "Requires field observation by the farmer or local technician."},
]


def r(value, digits=2):
    return None if value is None else round(value, digits)


def daily_series(power, parameter):
    fill = power.get("fillValue", -999)
    series = {}
    for key, value in power["parameters"][parameter].items():
        if value is None or value == fill:
            continue
        series[datetime.strptime(key, "%Y%m%d").date()] = float(value)
    return series


def longest_dry_spell(rain_by_day, year):
    longest = current = 0
    for day, rain in sorted((d, v) for d, v in rain_by_day.items() if d.year == year and d.month in RAINY_SEASON_MONTHS):
        current = current + 1 if rain < DRY_DAY_MM else 0
        longest = max(longest, current)
    return longest


def summarize_power(power):
    rain = daily_series(power, "PRECTOTCORR")
    tmax = daily_series(power, "T2M_MAX")
    soil = daily_series(power, "GWETROOT")
    years = sorted({d.year for d in rain})

    monthly_rain = defaultdict(list)
    for year in years:
        for month in range(1, 13):
            values = [v for d, v in rain.items() if d.year == year and d.month == month]
            if values:
                monthly_rain[month].append(sum(values))

    def monthly_mean(series, month):
        values = [v for d, v in series.items() if d.month == month]
        return statistics.fmean(values) if values else None

    annual_rain = [sum(v for d, v in rain.items() if d.year == y) for y in years]
    season_rain = [sum(v for d, v in rain.items() if d.year == y and d.month in RAINY_SEASON_MONTHS) for y in years]
    soil_by_year = {y: statistics.fmean([v for d, v in soil.items() if d.year == y]) for y in years}
    soil_mean = statistics.fmean(soil_by_year.values())
    latest = years[-1]

    monthly = [{
        "month": m,
        "rainMm": r(statistics.fmean(monthly_rain[m]), 1) if monthly_rain[m] else None,
        "soilMoisture": r(monthly_mean(soil, m), 3),
        "tMaxC": r(monthly_mean(tmax, m), 1),
        "ndvi": None,
    } for m in range(1, 13)]

    indicators = {
        "annualRainMm": r(statistics.fmean(annual_rain), 0),
        "rainVariabilityCv": r(statistics.pstdev(season_rain) / statistics.fmean(season_rain), 3),
        "longestDrySpellDays": r(statistics.fmean([longest_dry_spell(rain, y) for y in years]), 1),
        "soilMoistureMean": r(soil_mean, 3),
        "soilMoistureAnomaly": r(soil_by_year[latest] - soil_mean, 3),
        "extremeHeatDaysPerYear": r(statistics.fmean([sum(1 for d, v in tmax.items() if d.year == y and v >= EXTREME_HEAT_C) for y in years]), 1),
    }
    return monthly, indicators, years


def apply_ndvi(monthly, ndvi_raw):
    by_month = defaultdict(list)
    for sample in ndvi_raw["samples"]:
        by_month[date.fromisoformat(sample["date"]).month].append(sample["ndvi"])
    for row in monthly:
        values = by_month.get(row["month"])
        row["ndvi"] = r(statistics.fmean(values), 3) if values else None


def bare_field_window(monthly, has_ndvi):
    if has_ndvi:
        months = [row["month"] for row in monthly if row["ndvi"] is not None and row["ndvi"] < BARE_NDVI_THRESHOLD]
        return {"months": months, "method": f"MODIS NDVI < {BARE_NDVI_THRESHOLD}"}
    months = [row["month"] for row in monthly if row["rainMm"] is not None and row["rainMm"] < BARE_RAIN_PROXY_MM]
    return {"months": months, "method": f"Proxy: NASA POWER monthly rain < {BARE_RAIN_PROXY_MM:.0f} mm (NDVI not available)"}


def build_zone(zone):
    power = json.loads((RAW_DIR / f"power_{zone['id']}.json").read_text(encoding="utf-8"))
    monthly, indicators, years = summarize_power(power)
    sources = [{
        "dataset": "NASA POWER (daily, community AG)",
        "parameters": ["PRECTOTCORR", "T2M_MAX", "GWETROOT"],
        "period": f"{years[0]}-{years[-1]}",
        "url": "https://power.larc.nasa.gov/",
    }]
    gaps = list(ALWAYS_MISSING)

    ndvi_path = RAW_DIR / f"ndvi_{zone['id']}.json"
    has_ndvi = False
    if ndvi_path.exists():
        ndvi_raw = json.loads(ndvi_path.read_text(encoding="utf-8"))
        if ndvi_raw["samples"]:
            apply_ndvi(monthly, ndvi_raw)
            has_ndvi = True
            sources.append({
                "dataset": "MODIS MOD13Q1 NDVI (250 m, 16-day)",
                "parameters": ["250m_16_days_NDVI"],
                "period": f"{ndvi_raw['start']}-{ndvi_raw['end']}",
                "url": "https://modis.ornl.gov/data/modis_webservice.html",
            })
    if not has_ndvi:
        gaps.append({"key": "ndvi", "label": "Vegetation index (NDVI)", "reason": "MODIS NDVI not yet processed for this zone."})
    gaps.append({"key": "smap", "label": "Satellite soil moisture (SMAP)", "reason": "Soil moisture uses NASA POWER GWETROOT (model-based) until SMAP is processed."})

    indicators["bareFieldWindow"] = bare_field_window(monthly, has_ndvi)
    return {"zoneId": zone["id"], "monthly": monthly, "indicators": indicators, "sources": sources, "dataGaps": gaps}


def main():
    zones = {}
    for zone in load_zones():
        if not (RAW_DIR / f"power_{zone['id']}.json").exists():
            print(f"skip {zone['id']}: run fetch_nasa_power.py first")
            continue
        zones[zone["id"]] = build_zone(zone)
        print(f"summary -> {zone['id']}")
    write_json(DATA_DIR / "climate_summary.json", {
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "units": {"rainMm": "mm/month", "soilMoisture": "0-1 root-zone wetness (GWETROOT)", "tMaxC": "°C", "ndvi": "0-1"},
        "zones": zones,
    })


if __name__ == "__main__":
    main()
