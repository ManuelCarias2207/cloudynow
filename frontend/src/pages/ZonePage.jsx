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
import { cn, isInsideBounds } from '../lib/utils.js';

const ZoneMap = lazy(() => import('../components/zone/ZoneMap.jsx'));

export default function ZonePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { location, setLocation } = useFlow();
  const [message, setMessage] = useState('');
  const [locating, setLocating] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [cellPinned, setCellPinned] = useState(false);
  const [cellPreview, setCellPreview] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetRef = useRef(null);

  useEffect(() => {
    const phone = window.matchMedia('(max-width: 767px)');
    const observer = new ResizeObserver(([entry]) => setSheetHeight(phone.matches ? Math.round(entry.borderBoxSize[0].blockSize) : 0));
    observer.observe(sheetRef.current);
    return () => observer.disconnect();
  }, []);

  const pick = async (point) => {
    if (!isInsideBounds(point, EL_SALVADOR_BOUNDS)) {
      setMessage(t('zone.outside'));
      return;
    }
    setMessage('');
    setLocation({ ...point, label: point.label ?? null });
    if (!point.label) {
      const label = await placeName(point);
      setLocation((current) => (current?.lat === point.lat && current?.lon === point.lon ? { ...current, label: label ?? t('zone.unnamed') } : current));
    }
  };

  const locate = () => {
    if (!('geolocation' in navigator)) {
      setMessage(t('zone.geoUnsupported'));
      return;
    }
    setLocating(true);
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        pick({ lat: position.coords.latitude, lon: position.coords.longitude, source: 'gps' });
      },
      (error) => {
        setLocating(false);
        setMessage(error.code === error.PERMISSION_DENIED ? t('zone.geoDenied') : t('zone.geoFailed'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <div className="h-full md:grid md:grid-cols-[minmax(0,1fr)_380px]">
      <div className="absolute inset-0 md:static">
        <Suspense fallback={<div role="status" aria-label={t('zone.loadingMap')} className="h-full w-full bg-surface-2" />}>
          <ZoneMap selected={location} onPick={pick} showCell={cellPinned || cellPreview} bottomInset={sheetHeight} />
        </Suspense>
      </div>
      <section
        ref={sheetRef}
        aria-labelledby="zone-title"
        className="absolute inset-x-0 bottom-0 z-10 flex max-h-[50dvh] flex-col overflow-y-auto rounded-t-lg bg-surface shadow-pop md:static md:max-h-none md:rounded-none md:border-l md:border-line md:shadow-none"
      >
        <div className="flex flex-col gap-4 px-4 pt-3 md:pt-6">
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls="zone-panel"
            onClick={() => setCollapsed((value) => !value)}
            className="-mx-1 min-h-9 cursor-pointer self-center rounded-md px-3 text-sm font-medium text-muted hover:text-ink md:hidden"
          >
            {collapsed ? t('zone.showPanel') : t('zone.hidePanel')}
          </button>
          <div className={cn('-mb-4', collapsed && 'hidden md:block')}>
            <StepIndicator current={0} compact />
          </div>
          <h1 id="zone-title" className={cn('text-xl font-semibold', collapsed && 'sr-only md:not-sr-only')}>
            {t('zone.title')}
          </h1>
          <div id="zone-panel" className={cn('flex flex-col gap-4', collapsed && 'hidden md:flex')}>
            <PlaceSearch onPick={pick} />
            <Button variant="secondary" onClick={locate} disabled={locating} className="self-start">
              <LocateIcon className="size-4" />
              {locating ? t('zone.locating') : t('zone.useMyLocation')}
            </Button>
            {message && (
              <p role="alert" className="rounded-md bg-maize-soft px-3 py-2 text-sm text-maize-ink">
                {message}
              </p>
            )}
            <ZoneCard location={location} showCell={cellPinned} onToggleCell={() => setCellPinned((on) => !on)} onPreviewCell={setCellPreview} />
            <p className="text-xs text-muted">{t('footer')}</p>
          </div>
        </div>
        <div className="sticky bottom-0 mt-auto bg-surface px-4 pt-3 pb-4">
          <Button disabled={!location} onClick={() => navigate('/farm')} className="w-full">
            {location ? t('zone.continue') : t('zone.pickToContinue')}
          </Button>
        </div>
      </section>
    </div>
  );
}
