"""Shared helpers for the NASA preprocessing scripts."""
import json
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_DIR / "data"
RAW_DIR = DATA_DIR / "raw"


def load_zones(only=None):
    zones = json.loads((DATA_DIR / "zones.json").read_text(encoding="utf-8"))["zones"]
    if only:
        zones = [z for z in zones if z["id"] in only]
    return zones


def write_json(path, payload):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
