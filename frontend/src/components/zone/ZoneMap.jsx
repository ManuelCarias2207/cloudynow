import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import { EL_SALVADOR_BOUNDS, MAP_STYLE, SATELLITE_ATTRIBUTION, SATELLITE_TILES } from '../../lib/constants.js';
import { cn, powerCell } from '../../lib/utils.js';

const { minLat, maxLat, minLon, maxLon } = EL_SALVADOR_BOUNDS;
const COUNTRY = [
  [minLon, minLat],
  [maxLon, maxLat],
];
// Wide enough for tall phone screens to still show the whole country at minZoom.
const MAX_BOUNDS = [
  [minLon - 3, minLat - 2.5],
  [maxLon + 3, maxLat + 2.5],
];
// Layers that add tiles work or clutter without helping to find a farm.
const DROPPED_LAYERS = /^(building|railway|aeroway|airport|tunnel_|road_pier|road_area_pier|road_shield|highway-shield|landcover_ice|landcover_glacier)/;

const PIN_SVG =
  '<svg width="30" height="40" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 1.5C7.5 1.5 1.5 7.4 1.5 14.8 1.5 24.8 15 38.5 15 38.5s13.5-13.7 13.5-23.7C28.5 7.4 22.5 1.5 15 1.5z" fill="var(--color-accent)" stroke="var(--color-accent-ink)" stroke-width="2"/><circle cx="15" cy="15" r="5" fill="var(--color-accent-ink)"/></svg>';

function cellFeature(point) {
  const c = powerCell(point);
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[[c.minLon, c.minLat], [c.maxLon, c.minLat], [c.maxLon, c.maxLat], [c.minLon, c.maxLat], [c.minLon, c.minLat]]],
    },
  };
}

function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** `bottomInset` = px covered by the phone bottom sheet, so the map centers in the visible part. */
function mapPadding(bottomInset) {
  return { top: 24, left: 24, right: 24, bottom: bottomInset + 24 };
}

/**
 * MapLibre map: click to pick a point. `selected` = { lat, lon, source } shows the pin and the
 * NASA POWER cell outline when `showCell` is on. The pin can be dragged to correct the point; picks from search or GPS ('search' | 'gps') also move the map there.
 */
export default function ZoneMap({ selected, onPick, showCell = false, bottomInset = 0 }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const cellLabelRef = useRef(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [loaded, setLoaded] = useState(false);
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    const padding = mapPadding(bottomInset);
    const map = new maplibregl.Map({
      container: containerRef.current,
      bounds: COUNTRY,
      fitBoundsOptions: { padding },
      maxBounds: MAX_BOUNDS,
      minZoom: 6.5,
      maxZoom: 16,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      pixelRatio: Math.min(window.devicePixelRatio, 2),
    });
    map.setStyle(MAP_STYLE, {
      transformStyle: (_previous, next) => ({ ...next, layers: next.layers.filter((layer) => !DROPPED_LAYERS.test(layer.id)) }),
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('click', (event) => onPickRef.current({ lat: event.lngLat.lat, lon: event.lngLat.lng, source: 'map' }));
    map.on('load', () => {
      map.setPadding(padding);
      map.addSource('power-cell', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'power-cell-line',
        type: 'line',
        source: 'power-cell',
        layout: { visibility: 'none' },
        paint: { 'line-color': readToken('--color-brand'), 'line-opacity': 0.6, 'line-width': 1, 'line-dasharray': [3, 3] },
      });
      setLoaded(true);
    });
    map.getCanvas().style.cursor = 'crosshair';
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (loaded) mapRef.current.easeTo({ padding: mapPadding(bottomInset), duration: 200 });
  }, [bottomInset, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded) return;
    const cell = map.getSource('power-cell');
    if (!selected) {
      markerRef.current?.remove();
      markerRef.current = null;
      cell.setData({ type: 'FeatureCollection', features: [] });
      cellLabelRef.current?.remove();
      cellLabelRef.current = null;
      return;
    }
    const position = [selected.lon, selected.lat];
    if (!markerRef.current) {
      const element = document.createElement('div');
      element.className = 'map-pin';
      element.innerHTML = PIN_SVG;
      markerRef.current = new maplibregl.Marker({ element, anchor: 'bottom', draggable: true }).setLngLat(position).addTo(map);
      markerRef.current.on('dragend', () => {
        const { lat, lng } = markerRef.current.getLngLat();
        onPickRef.current({ lat, lon: lng, source: 'drag' });
      });
    } else if (selected.source !== 'drag') {
      markerRef.current.setLngLat(position);
      const svg = markerRef.current.getElement().firstElementChild;
      svg.style.animation = 'none';
      void svg.getBoundingClientRect();
      svg.style.animation = '';
    }
    const feature = cellFeature(selected);
    cell.setData(feature);
    const [ring] = feature.geometry.coordinates;
    if (!cellLabelRef.current) {
      const element = document.createElement('span');
      element.className = 'map-cell-label';
      cellLabelRef.current = new maplibregl.Marker({ element, anchor: 'top-left', offset: [4, 4] });
    }
    cellLabelRef.current.setLngLat(ring[3]);
    if (selected.source === 'search' || selected.source === 'gps') {
      const zoom = selected.source === 'gps' && !(selected.accuracy > 5000) ? 13 : 11;
      map.flyTo({ center: position, zoom, padding: mapPadding(bottomInset), duration: 800 });
    }
  }, [selected, loaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded) return;
    const visible = showCell && Boolean(selected);
    map.setLayoutProperty('power-cell-line', 'visibility', visible ? 'visible' : 'none');
    const label = cellLabelRef.current;
    if (!label) return;
    label.getElement().textContent = t('zone.cellLabel');
    if (visible) label.addTo(map);
    else label.remove();
  }, [showCell, selected, loaded, t]);

  useEffect(() => {
    const map = mapRef.current;
    if (!loaded) return;
    if (!map.getSource('satellite')) {
      if (!satellite) return;
      map.addSource('satellite', { type: 'raster', tiles: [SATELLITE_TILES], tileSize: 256, maxzoom: 17, attribution: SATELLITE_ATTRIBUTION });
      const firstLabel = map.getStyle().layers.find((layer) => layer.type === 'symbol')?.id;
      map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite' }, firstLabel);
      return;
    }
    map.setLayoutProperty('satellite', 'visibility', satellite ? 'visible' : 'none');
  }, [satellite, loaded]);

  useEffect(() => {
    const container = containerRef.current;
    container.querySelector('canvas')?.setAttribute('aria-label', t('zone.map'));
    for (const [selector, key] of [['.maplibregl-ctrl-zoom-in', 'zone.zoomIn'], ['.maplibregl-ctrl-zoom-out', 'zone.zoomOut']]) {
      container.querySelector(selector)?.setAttribute('aria-label', t(key));
      container.querySelector(selector)?.setAttribute('title', t(key));
    }
  }, [t, loaded]);

  return (
    <div className="relative h-full w-full bg-surface-2">
      <div ref={containerRef} className="h-full w-full" />
      <button
        type="button"
        aria-pressed={satellite}
        disabled={!loaded}
        onClick={() => setSatellite((on) => !on)}
        className={cn(
          'absolute top-2.5 left-2.5 min-h-11 cursor-pointer rounded-md px-3 text-sm font-medium shadow-pop ring-1 ring-line-strong disabled:cursor-wait',
          satellite ? 'bg-brand text-white' : 'bg-surface text-ink hover:bg-surface-2',
        )}
      >
        {t('zone.satellite')}
      </button>
    </div>
  );
}
