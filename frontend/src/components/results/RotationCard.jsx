import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import ScoreBreakdown from './ScoreBreakdown.jsx';
import EvidenceList from './EvidenceList.jsx';
import InfoGaps from './InfoGaps.jsx';
import { toPercent, cn } from '../../lib/utils.js';

function TextList({ items, tone }) {
  return (
    <ul className="space-y-1 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', tone)} />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function RotationCard({ rotation, weights, best }) {
  const { t } = useTranslation();
  return (
    <Card className={cn('flex flex-col gap-4', best && 'ring-2 ring-zinc-900')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-zinc-500">{t('results.option', { id: rotation.id })}</p>
          <h3 className="font-semibold">{rotation.name}</h3>
          <p className="mt-1 text-sm text-zinc-600">{rotation.crops.map((crop) => crop.name).join(' → ')}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold">{toPercent(rotation.scores.total)}</p>
          {best && <Badge tone="good">{t('results.best')}</Badge>}
        </div>
      </div>
      <ScoreBreakdown scores={rotation.scores} weights={weights} />
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">{t('results.benefits')}</p>
        <TextList items={rotation.benefits} tone="bg-lime-500" />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">{t('results.risks')}</p>
        <TextList items={rotation.risks} tone="bg-amber-500" />
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-zinc-500">{t('results.evidence')}</summary>
        <div className="mt-2">
          <EvidenceList evidence={rotation.evidence} />
        </div>
      </details>
      <details className="text-sm">
        <summary className="cursor-pointer text-xs font-medium text-zinc-500">{t('results.gaps')}</summary>
        <div className="mt-2">
          <InfoGaps gaps={rotation.informationGaps} />
        </div>
      </details>
    </Card>
  );
}
