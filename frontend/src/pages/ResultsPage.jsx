import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import ClimateCharts from '../components/charts/ClimateCharts.jsx';
import RotationComparison from '../components/results/RotationComparison.jsx';
import SupportNotice from '../components/results/SupportNotice.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { useFlow } from '../hooks/useFlow.js';
import { recommend } from '../services/api.js';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { location, currentCrops, priority } = useFlow();
  const [state, setState] = useState({ status: 'loading' });
  const ready = location && currentCrops.length > 0 && priority;

  useEffect(() => {
    if (!ready) return undefined;
    let active = true;
    setState({ status: 'loading' });
    recommend({ lat: location.lat, lon: location.lon, currentCrops, priority })
      .then((data) => active && setState({ status: 'done', data }))
      .catch((error) => active && setState({ status: 'error', message: error.message }));
    return () => {
      active = false;
    };
  }, [ready, location, currentCrops, priority]);

  if (!ready) return <Navigate to="/farm" replace />;

  return (
    <>
      <StepIndicator current={2} />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Three rotations for your farm</h1>
          <p className="text-sm text-zinc-500">{location.label ?? `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}`}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/farm')}>
          Change answers
        </Button>
      </div>
      {state.status === 'loading' && <p className="text-sm text-zinc-500">Reading 10 years of NASA POWER data…</p>}
      {state.status === 'error' && <p className="text-sm text-red-700">{state.message}</p>}
      {state.status === 'done' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {state.data.similar && <Badge tone="warn">Top options are very similar</Badge>}
            {state.data.fallback && <Badge tone="warn">Using stored data</Badge>}
            <Badge>
              {state.data.indicators.meanAnnualRainMm} mm rain/year · dry spell {state.data.indicators.longestDrySpellDays} days
            </Badge>
          </div>
          <p className="text-sm text-zinc-600">{state.data.confidenceNote}</p>
          <RotationComparison rotations={state.data.rotations} weights={state.data.weights} />
          <ClimateCharts
            monthly={state.data.monthly}
            indicators={state.data.indicators}
            hasSoilMoisture={state.data.hasSoilMoisture}
            dataSource={state.data.dataSource}
          />
          <SupportNotice text={state.data.disclaimer} />
        </div>
      )}
    </>
  );
}
