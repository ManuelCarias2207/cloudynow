import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import { SummarySlide, OptionSlide, ClimateSlide, BeforeSlide, ranked } from '../components/results/ResultSlides.jsx';
import Button from '../components/ui/Button.jsx';
import Skeleton, { SkeletonBlock } from '../components/ui/Skeleton.jsx';
import { useFlow } from '../hooks/useFlow.js';
import { recommend } from '../services/api.js';
import { cn } from '../lib/utils.js';

function LoadingSlide({ label }) {
  return (
    <div className="grid h-full gap-6 md:grid-cols-2 md:items-center">
      <Skeleton lines={5} label={label} />
      <SkeletonBlock label={label} className="h-56 w-full" />
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { location, currentCrops, priority } = useFlow();
  const [state, setState] = useState({ status: 'loading' });
  const [index, setIndex] = useState(0);
  const ready = location && currentCrops.length > 0 && priority;

  useEffect(() => {
    if (!ready) return undefined;
    let active = true;
    setState({ status: 'loading' });
    recommend({ lat: location.lat, lon: location.lon, currentCrops, priority, lang })
      .then((data) => active && setState({ status: 'done', data }))
      .catch((error) => active && setState({ status: 'error', message: error.message }));
    return () => {
      active = false;
    };
  }, [ready, location, currentCrops, priority, lang]);

  const data = state.data;
  const place = location?.label ?? (location ? `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}` : '');
  const bestId = data ? ranked(data.rotations)[0].id : null;

  const slides = data
    ? [
        { id: 'summary', name: t('slides.names.summary') },
        ...data.rotations.map((rotation) => ({ id: rotation.id, name: t('slides.names.option', { id: rotation.id }) })),
        { id: 'climate', name: t('slides.names.climate') },
        { id: 'before', name: t('slides.names.before') },
      ]
    : [];
  const last = slides.length - 1;

  const go = useCallback((next) => setIndex((current) => Math.min(Math.max(next(current), 0), Math.max(last, 0))), [last]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest?.('input, textarea')) return;
      if (event.key === 'ArrowRight') go((current) => current + 1);
      if (event.key === 'ArrowLeft') go((current) => current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  if (!ready) return <Navigate to="/farm" replace />;

  const slide = slides[index];
  const openOption = (id) => setIndex(slides.findIndex((item) => item.id === id));

  const content = () => {
    if (slide.id === 'summary') return <SummarySlide data={data} place={place} priority={priority} onOpen={openOption} />;
    if (slide.id === 'climate') return <ClimateSlide data={data} />;
    if (slide.id === 'before') {
      return (
        <BeforeSlide
          data={data}
          actions={
            <>
              <Button onClick={() => navigate('/farm')}>{t('slides.change')}</Button>
              <Button variant="secondary" onClick={() => navigate('/zone')}>
                {t('slides.restart')}
              </Button>
            </>
          }
        />
      );
    }
    const rotation = data.rotations.find((item) => item.id === slide.id);
    return <OptionSlide rotation={rotation} weights={data.weights} isBest={rotation.id === bestId} />;
  };

  return (
    <>
      <StepIndicator current={2} />
      <section aria-roledescription="carousel" aria-label={t('slides.nav')} className="flex min-h-0 flex-1 flex-col">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-surface/60 p-4 ring-1 ring-line sm:p-7">
          {state.status === 'loading' && <LoadingSlide label={t('results.loading')} />}
          {state.status === 'error' && (
            <p role="alert" className="text-sm text-danger">
              {state.message}
            </p>
          )}
          {state.status === 'done' && (
            <div key={slide.id} role="group" aria-roledescription="slide" aria-label={slide.name} className="h-full animate-enter">
              {content()}
            </div>
          )}
        </div>
        <nav aria-label={t('slides.nav')} className="mt-3 flex shrink-0 items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => (index === 0 ? navigate('/farm') : go((current) => current - 1))}>
            <span aria-hidden="true">←</span>
            <span className="max-sm:hidden">{index === 0 ? t('results.change') : t('slides.back')}</span>
          </Button>
          <p className="text-sm font-medium whitespace-nowrap text-muted sm:hidden">{slides.length > 0 && t('slides.count', { current: index + 1, total: slides.length })}</p>
          <ol className="flex min-w-0 items-center gap-1.5 max-sm:hidden">
            {slides.map((item, itemIndex) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={t('slides.goTo', { n: itemIndex + 1, name: item.name })}
                  aria-current={itemIndex === index ? 'step' : undefined}
                  className={cn(
                    'flex h-8 items-center rounded-full px-1 transition-[width,background-color] duration-200 ease-standard',
                    itemIndex === index ? 'bg-brand px-3 text-xs font-medium text-white' : 'w-8 justify-center',
                  )}
                >
                  {itemIndex === index ? <span className="whitespace-nowrap">{item.name}</span> : <span aria-hidden="true" className="size-2 rounded-full bg-line-strong/60" />}
                </button>
              </li>
            ))}
          </ol>
          <Button disabled={!data || index === last} onClick={() => go((current) => current + 1)}>
            {t('slides.next')}
            <span aria-hidden="true">→</span>
          </Button>
        </nav>
      </section>
    </>
  );
}
