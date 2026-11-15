import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import FarmForm from '../components/farm/FarmForm.jsx';
import Button from '../components/ui/Button.jsx';
import { useFlow } from '../hooks/useFlow.js';

export default function FarmPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { location, currentCrops, setCurrentCrops, priority, setPriority } = useFlow();
  if (!location) return <Navigate to="/zone" replace />;
  return (
    <>
      <StepIndicator current={1} />
      <div className="mb-3 shrink-0">
        <h1 className="text-xl font-semibold">{t('farm.title')}</h1>
        <p className="text-sm text-muted">{location.label ?? `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}`}</p>
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
        <FarmForm crops={currentCrops} onCropsChange={setCurrentCrops} priority={priority} onPriorityChange={setPriority} />
      </div>
      <div className="mt-3 flex shrink-0 justify-between gap-3">
        <Button variant="secondary" onClick={() => navigate('/zone')}>
          {t('farm.back')}
        </Button>
        <Button disabled={currentCrops.length === 0 || !priority} onClick={() => navigate('/results')}>
          {t('farm.compare')}
        </Button>
      </div>
    </>
  );
}
