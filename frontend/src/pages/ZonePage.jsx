import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import ZoneCard from '../components/zone/ZoneCard.jsx';
import PlaceSearch from '../components/zone/PlaceSearch.jsx';
import Button from '../components/ui/Button.jsx';
import { LocateIcon } from '../components/ui/icons.jsx';
import { useFlow } from '../hooks/useFlow.js';
import { placeName } from '../services/api.js';
import { EL_SALVADOR_BOUNDS } from '../lib/constants.js';
import { isInsideBounds } from '../lib/utils.js';

const ZoneMap = lazy(() => import('../components/zone/ZoneMap.jsx'));

// GPS keeps refining after the first fix: stop once this good or after this long.
const GOOD_ACCURACY_M = 20;
const REFINE_MS = 20000;

export default function ZonePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { location, setLocation } = useFlow();
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [refining, setRefining] = useState(null); // accuracy in m while the GPS keeps improving
  const [showCell, setShowCell] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const watchRef = useRef(null);
  const timerRef = useRef(null);
  const bestRef = useRef(null);

  const nameFor = async (point) => {
    const label = await placeName(point);
    setLocation((current) => (current?.lat === point.lat && current?.lon === point.lon ? { ...current, label, naming: false } : current));
  };

  const stopWatch = () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    clearTimeout(timerRef.current);
    setLocating(false);
    setRefining(null);
  };

  useEffect(() => () => stopWatch(), []);

  // Fetch the map chunk only after the page has painted, so it never delays the first render.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setTimeout(() => setMapReady(true)));
    return () => cancelAnimationFrame(frame);
  }, []);

  const pick = (point) => {
    if (watchRef.current !== null && point.source !== 'gps') stopWatch();
    if (!isInsideBounds(point, EL_SALVADOR_BOUNDS)) {
      setMessage(t('zone.outside'));
      return;
    }
    setMessage('');
    setLocation({ ...point, label: point.label ?? null, naming: !point.label });
    if (!point.label && point.source !== 'gps') nameFor(point);
  };

  const finishGps = () => {
    const best = bestRef.current;
    stopWatch();
    if (best && isInsideBounds(best, EL_SALVADOR_BOUNDS)) nameFor(best);
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setMessage(t('zone.geoUnsupported'));
      return;
    }
    stopWatch();
    bestRef.current = null;
    setLocating(true);
    setMessage('');
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (bestRef.current && accuracy >= bestRef.current.accuracy) return;
        const point = { lat: latitude, lon: longitude, accuracy, source: 'gps' };
        bestRef.current = point;
        pick(point);
        setRefining(accuracy);
        if (accuracy <= GOOD_ACCURACY_M) finishGps();
      },
      (error) => {
        if (bestRef.current) return finishGps();
        stopWatch();
        const key = { 1: 'zone.geoDenied', 2: 'zone.geoUnavailable', 3: 'zone.geoTimeout' }[error.code] ?? 'zone.geoUnavailable';
        setMessage(t(key));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
    timerRef.current = setTimeout(finishGps, REFINE_MS);
  };

  const mapPlaceholder = <div role="status" aria-label={t('zone.loadingMap')} className="h-full w-full rounded-lg bg-surface-2 ring-1 ring-line" />;
  const locateLabel = refining !== null ? t('zone.refining', { meters: Math.round(refining).toLocaleString() }) : locating ? t('zone.locating') : t('zone.useMyLocation');

  return (
    <>
      <StepIndicator current={0} />
      <h1 className="mb-3 shrink-0 text-xl font-semibold">{t('zone.title')}</h1>
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-4">
        <div className="min-h-48 flex-1 md:h-full md:min-h-0">
          {mapReady ? (
            <Suspense fallback={mapPlaceholder}>
              <ZoneMap selected={location} onPick={pick} showCell={showCell} />
            </Suspense>
          ) : (
            mapPlaceholder
          )}
        </div>
        <div className="flex max-h-[55%] shrink-0 flex-col gap-3 md:max-h-none md:min-h-0">
          <div className="-mx-1 flex min-h-0 flex-col gap-3 overflow-y-auto px-1 pb-1">
            <PlaceSearch onPick={pick} />
            <Button variant="secondary" onClick={locate} disabled={locating} aria-live="polite" className="self-start">
              <LocateIcon className="size-4" />
              {locateLabel}
            </Button>
            {message && (
              <p role="alert" className="rounded-md bg-maize-soft px-3 py-2 text-sm text-maize-ink">
                {message}
              </p>
            )}
            <ZoneCard location={location} showCell={showCell} onToggleCell={() => setShowCell((on) => !on)} />
          </div>
          <Button disabled={!location} onClick={() => navigate('/farm')} className="shrink-0 md:mt-auto">
            {location ? t('zone.continue') : t('zone.pickToContinue')}
          </Button>
        </div>
      </div>
    </>
  );
}
