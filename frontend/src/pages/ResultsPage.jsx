import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import RotationComparison from '../components/results/RotationComparison.jsx';
import { RotationDetail } from '../components/results/RotationCard.jsx';
import SupportNotice from '../components/results/SupportNotice.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Tabs from '../components/ui/Tabs.jsx';
import Skeleton, { SkeletonBlock } from '../components/ui/Skeleton.jsx';
import { useFlow } from '../hooks/useFlow.js';
import { recommend } from '../services/api.js';

// Charts pull in recharts, so they load only when their tab opens.
const ClimateCharts = lazy(() => import('../components/charts/ClimateCharts.jsx'));

function LoadingCards({ label }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <Card key={index} className={index > 0 ? 'max-lg:hidden' : undefined}>
          <Skeleton lines={2} label={label} />
          <Skeleton lines={5} label={label} className="mt-6" />
        </Card>
      ))}
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { location, currentCrops, priority } = useFlow();
  const [state, setState] = useState({ status: 'loading' });
  const [tab, setTab] = useState('compare');
  const [selected, setSelected] = useState(null);
  const ready = location && currentCrops.length > 0 && priority;

  useEffect(() => {
    if (!ready) return undefined;
    let active = true;
    setState({ status: 'loading' });
    recommend({ lat: location.lat, lon: location.lon, currentCrops, priority, lang })
      .then((data) => {
        if (!active) return;
        setState({ status: 'done', data });
        const best = data.rotations.reduce((top, rotation) => (rotation.scores.total > top.scores.total ? rotation : top));
        setSelected((current) => current ?? best.id);
      })
      .catch((error) => active && setState({ status: 'error', message: error.message }));
    return () => {
      active = false;
    };
  }, [ready, location, currentCrops, priority, lang]);

  if (!ready) return <Navigate to="/farm" replace />;

  const data = state.data;
  const rotation = data?.rotations.find((item) => item.id === selected);
  const openDetail = (id) => {
    setSelected(id);
    setTab('detail');
  };

  const panels = data && [
    {
      id: 'compare',
      label: t('layout.compare'),
      content: <RotationComparison rotations={data.rotations} weights={data.weights} selected={selected} onSelect={setSelected} onOpen={openDetail} />,
    },
    {
      id: 'detail',
      label: t('layout.detail'),
      content: (
        <div className="flex flex-col gap-3">
          <Tabs
            label={t('layout.options')}
            value={selected}
            onChange={setSelected}
            items={data.rotations.map((item) => ({ id: item.id, label: t('results.option', { id: item.id }) }))}
          />
          {rotation && (
            <Card key={rotation.id} enter>
              <h2 className="mb-4 font-semibold">{rotation.name}</h2>
              <RotationDetail rotation={rotation} />
            </Card>
          )}
          <p className="text-xs text-muted">{data.confidenceNote}</p>
          <SupportNotice text={data.disclaimer} />
        </div>
      ),
    },
    {
      id: 'climate',
      label: t('layout.climate'),
      content: (
        <Suspense fallback={<SkeletonBlock label={t('layout.loadingCharts')} className="h-80 w-full" />}>
          <ClimateCharts monthly={data.monthly} indicators={data.indicators} hasSoilMoisture={data.hasSoilMoisture} dataSource={data.dataSource} />
        </Suspense>
      ),
    },
  ];

  return (
    <>
      <StepIndicator current={2} />
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">{t('results.title')}</h1>
          <p className="truncate text-sm text-muted">{location.label ?? `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data?.similar && <Badge tone="warn">{t('results.similar')}</Badge>}
          {data?.fallback && <Badge tone="warn">{t('results.stored')}</Badge>}
          {data && (
            <Badge className="max-sm:hidden">
              {t('results.summary', { rain: data.indicators.meanAnnualRainMm, days: data.indicators.longestDrySpellDays })}
            </Badge>
          )}
          <Button variant="secondary" size="sm" onClick={() => navigate('/farm')}>
            {t('results.change')}
          </Button>
        </div>
      </div>
      {state.status === 'loading' && <LoadingCards label={t('results.loading')} />}
      {state.status === 'error' && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.status === 'done' && (
        <Tabs
          label={t('layout.resultsTabs')}
          value={tab}
          onChange={setTab}
          items={panels}
          className="flex min-h-0 flex-1 flex-col"
          listClassName="self-start"
          panelClassName="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1"
        />
      )}
    </>
  );
}
