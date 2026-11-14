import { Navigate, useNavigate } from 'react-router-dom';
import StepIndicator from '../components/layout/StepIndicator.jsx';
import FarmForm from '../components/farm/FarmForm.jsx';
import Button from '../components/ui/Button.jsx';
import { useFlow } from '../hooks/useFlow.js';

export default function FarmPage() {
  const navigate = useNavigate();
  const { location, currentCrops, setCurrentCrops, priority, setPriority } = useFlow();
  if (!location) return <Navigate to="/zone" replace />;
  return (
    <>
      <StepIndicator current={1} />
      <h1 className="mb-1 text-xl font-semibold">Your farm</h1>
      <p className="mb-4 text-sm text-zinc-500">{location.label ?? `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)}`}</p>
      <FarmForm crops={currentCrops} onCropsChange={setCurrentCrops} priority={priority} onPriorityChange={setPriority} />
      <div className="mt-4 flex justify-between">
        <Button variant="secondary" onClick={() => navigate('/zone')}>
          Back
        </Button>
        <Button disabled={currentCrops.length === 0 || !priority} onClick={() => navigate('/results')}>
          Compare rotations
        </Button>
      </div>
    </>
  );
}
