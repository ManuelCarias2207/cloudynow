import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTranslation } from 'react-i18next';
import { EL_SALVADOR_BOUNDS, MAP_STYLE, SATELLITE_ATTRIBUTION, SATELLITE_TILES } from '../../lib/constants.js';
import { cn, powerCell } from '../../lib/utils.js';
import { CloseIcon, ExpandIcon } from '../ui/icons.jsx';

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

const PADDING = { top: 24, left: 24, right: 24, bottom: 24 };
const PHONE = '(max-width: 767px)';

/**
 * MapLibre map: click to pick a point. `selected` = { lat, lon, source } shows the pin and the
 * NASA POWER cell outline when `showCell` is on. The pin can be dragged to correct the point; picks from search or GPS ('search' | 'gps') also move the map there.
 * Fills its parent (which reserves the height); the expand button opens it over the page below the header (full screen on phones).
 */
export default function ZoneMap({ selected, onPick, showCell = false }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const cellLabelRef = useRef(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [loaded, setLoaded] = useState(false);
  const [satellite, setSatellite] = useState(false);
  const [expanded, setExpanded] = useState(null); // null = inline, else { top } in px
  const expandButtonRef = useRef(null);

  useEffect(() => {
    const padding = PADDING;
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
      // Inline on touch screens, one finger scrolls the page; two fingers move the map.
      cooperativeGestures: window.matchMedia('(pointer: coarse)').matches,
      locale: { 'CooperativeGesturesHandler.MobileHelpText': t('zone.twoFingers'), 'CooperativeGesturesHandler.WindowsHelpText': t('zone.ctrlZoom'), 'CooperativeGesturesHandler.MacHelpText': t('zone.cmdZoom') },
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

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    map.resize();
    map.jumpTo({ center, zoom });
    if (window.matchMedia('(pointer: coarse)').matches) {
      if (expanded) map.cooperativeGestures.disable();
      else map.cooperativeGestures.enable();
    }
    if (!expanded) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') collapse();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [expanded]);

  function expand() {
    const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    setExpanded({ top: window.matchMedia(PHONE).matches ? 0 : Math.max(0, Math.round(header)) });
  }

  function collapse() {
    setExpanded(null);
    requestAnimationFrame(() => expandButtonRef.current?.focus());
  }

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
      map.flyTo({ center: position, zoom, padding: PADDING, duration: 800 });
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
    <div
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? t('zone.map') : undefined}
      style={expanded ? { top: expanded.top } : undefined}
      className={cn(
        'zone-map bg-surface-2',
        expanded ? 'map-expanded fixed inset-x-0 bottom-0 z-50' : 'relative h-full w-full overflow-hidden rounded-lg ring-1 ring-line',
      )}
    >
      <div ref={containerRef} className="h-full w-full" />
      <button
        ref={expandButtonRef}
        type="button"
        aria-label={expanded ? t('zone.collapseMap') : t('zone.expandMap')}
        title={expanded ? undefined : t('zone.expandMap')}
        onClick={expanded ? collapse : expand}
        className="absolute top-2.5 right-2.5 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-surface px-3 text-sm font-medium text-ink shadow-pop ring-1 ring-line-strong hover:bg-surface-2"
      >
        {expanded ? <CloseIcon className="size-4" /> : <ExpandIcon className="size-4" />}
        {expanded && t('zone.collapseMap')}
      </button>
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
