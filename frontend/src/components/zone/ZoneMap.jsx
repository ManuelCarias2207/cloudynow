import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { EL_SALVADOR_BOUNDS, MAP_CENTER, MAP_STYLE } from '../../lib/constants.js';

const { minLat, maxLat, minLon, maxLon } = EL_SALVADOR_BOUNDS;
const MAX_BOUNDS = [
  [minLon - 0.6, minLat - 0.6],
  [maxLon + 0.6, maxLat + 0.6],
];

/** MapLibre map: click to pick a point. `selected` = { lat, lon } shows a marker and flies to it. */
export default function ZoneMap({ selected, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: 7.6,
      maxBounds: MAX_BOUNDS,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('click', (event) => onPickRef.current({ lat: event.lngLat.lat, lon: event.lngLat.lng }));
    map.getCanvas().style.cursor = 'crosshair';
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!selected) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const position = [selected.lon, selected.lat];
    if (!markerRef.current) markerRef.current = new maplibregl.Marker({ color: '#18181b' }).setLngLat(position).addTo(map);
    else markerRef.current.setLngLat(position);
    if (!map.getBounds().contains(position)) map.flyTo({ center: position, zoom: 10 });
  }, [selected]);

  return <div ref={containerRef} className="h-[420px] w-full overflow-hidden rounded-2xl ring-1 ring-zinc-200" />;
}
