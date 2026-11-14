import Card from '../ui/Card.jsx';
import CropStep from './CropStep.jsx';
import PriorityStep from './PriorityStep.jsx';

export default function FarmForm({ crops, onCropsChange, priority, onPriorityChange }) {
  return (
    <Card className="space-y-6">
      <CropStep value={crops} onChange={onCropsChange} />
      <PriorityStep value={priority} onChange={onPriorityChange} />
    </Card>
  );
}
