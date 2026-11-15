import { lazy, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import ZoneCard from '../components/zone/ZoneCard.jsx';
import Button from '../components/ui/Button.jsx';
import { useFlow } from '../hooks/useFlow.js';
import { searchPlaces, placeName } from '../services/api.js';
import { EL_SALVADOR_BOUNDS } from '../lib/constants.js';
import { isInsideBounds } from '../lib/utils.js';

const ZoneMap = lazy(() => import('../components/zone/ZoneMap.jsx'));

export default function ZonePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { location, setLocation } = useFlow();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');

  const pick = async (point) => {
    if (!isInsideBounds(point, EL_SALVADOR_BOUNDS)) {
      setMessage(t('zone.outside'));
      return;
    }
    setMessage('');
    setResults([]);
    setLocation({ ...point, label: point.label ?? null });
    if (!point.label) {
      const label = await placeName(point);
      setLocation((current) => (current?.lat === point.lat && current?.lon === point.lon ? { ...current, label: label ?? t('zone.unnamed') } : current));
    }
  };

  const search = async (event) => {
    event.preventDefault();
    if (!query.trim()) return;
    try {
      const places = await searchPlaces(query.trim());
      setResults(places);
      setMessage(places.length === 0 ? t('zone.noPlaces') : '');
    } catch {
      setMessage(t('zone.searchUnavailable'));
    }
  };

  return (
    <>
      <StepIndicator current={0} />
      <h1 className="mb-4 text-xl font-semibold">{t('zone.title')}</h1>
      <form onSubmit={search} className="relative mb-3 flex gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('zone.searchPlaceholder')}
          aria-label={t('zone.searchPlaceholder')}
          className="min-h-11 w-full rounded-md bg-surface px-4 py-2.5 text-sm ring-1 ring-line-strong placeholder:text-muted"
        />
        <Button type="submit" variant="secondary">
          {t('zone.search')}
        </Button>
        {results.length > 0 && (
          <ul className="absolute top-full z-10 mt-1 w-full overflow-hidden rounded-md bg-surface shadow-pop ring-1 ring-line">
            {results.map((place) => (
              <li key={`${place.lat},${place.lon}`}>
                <button type="button" onClick={() => pick(place)} className="min-h-11 w-full cursor-pointer px-4 py-2 text-left text-sm hover:bg-surface-2">
                  {place.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>
      {message && <p role="status" className="mb-3 rounded-md bg-maize-soft px-3 py-2 text-sm text-maize-ink">{message}</p>}
      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        <Suspense
          fallback={
            <div role="status" className="flex h-[420px] w-full items-center justify-center rounded-lg bg-surface-2 text-sm text-muted ring-1 ring-line">
              {t('zone.loadingMap')}
            </div>
          }
        >
          <ZoneMap selected={location} onPick={pick} />
        </Suspense>
        <div className="flex flex-col gap-4">
          <ZoneCard location={location} />
          <Button disabled={!location} onClick={() => navigate('/farm')}>
            {location ? t('zone.continue') : t('zone.pickToContinue')}
          </Button>
        </div>
      </div>
    </>
  );
}
