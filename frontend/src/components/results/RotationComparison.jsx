import { useTranslation } from 'react-i18next';
import RotationCard from './RotationCard.jsx';
import Button from '../ui/Button.jsx';
import Tabs from '../ui/Tabs.jsx';
import { cn, toPercent } from '../../lib/utils.js';

/** Three summary cards side by side; on small screens an A/B/C selector shows one card at a time. */
export default function RotationComparison({ rotations, weights, selected, onSelect, onOpen }) {
  const { t } = useTranslation();
  const bestTotal = Math.max(...rotations.map((rotation) => rotation.scores.total));
  return (
    <div className="flex flex-col gap-3">
      <Tabs
        label={t('layout.options')}
        value={selected}
        onChange={onSelect}
        className="lg:hidden"
        listClassName="w-full [&>button]:flex-1"
        items={rotations.map((rotation) => ({ id: rotation.id, label: `${rotation.id} · ${toPercent(rotation.scores.total)}` }))}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {rotations.map((rotation) => (
          <RotationCard
            key={rotation.id}
            rotation={rotation}
            weights={weights}
            best={rotation.scores.total === bestTotal}
            className={cn(rotation.id !== selected && 'max-lg:hidden')}
            action={
              <Button variant="ghost" size="sm" className="-ml-3" onClick={() => onOpen(rotation.id)}>
                {t('layout.viewDetail')}
                <span aria-hidden="true">→</span>
              </Button>
            }
          />
        ))}
      </div>
    </div>
  );
}
