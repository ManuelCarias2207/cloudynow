import { useTranslation } from 'react-i18next';
import Card from '../ui/Card.jsx';
import Badge from '../ui/Badge.jsx';
import ScoreBreakdown from './ScoreBreakdown.jsx';
import EvidenceList from './EvidenceList.jsx';
import InfoGaps from './InfoGaps.jsx';
import { toPercent, cn } from '../../lib/utils.js';

function Section({ title, children }) {
  return (
    <details className="group text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-1 rounded-sm text-xs font-medium text-muted transition-colors hover:text-ink [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 transition-transform duration-200 ease-standard group-open:rotate-90">
          <path d="m6 4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {title}
      </summary>
      <div className="mt-2 animate-enter">{children}</div>
    </details>
  );
}

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
    <Card selected={best} interactive enter className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge size="sm" outline tone={best ? 'good' : 'neutral'}>
            {t('results.option', { id: rotation.id })}
          </Badge>
          <h3 className="mt-2 font-semibold text-balance">{rotation.name}</h3>
          <p className="mt-1 text-sm text-muted">{rotation.crops.map((crop) => crop.name).join(' → ')}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <p className={cn('text-3xl font-semibold tabular-nums', best && 'text-brand')}>{toPercent(rotation.scores.total)}</p>
          {best && (
            <Badge tone="good" dot>
              {t('results.best')}
            </Badge>
          )}
        </div>
      </div>
      <ScoreBreakdown scores={rotation.scores} weights={weights} />
      <div>
        <p className="mb-1 text-xs font-medium text-muted">{t('results.benefits')}</p>
        <TextList items={rotation.benefits} tone="bg-brand" />
      </div>
      <div>
        <p className="mb-1 text-xs font-medium text-muted">{t('results.risks')}</p>
        <TextList items={rotation.risks} tone="bg-maize" />
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-3">
        <Section title={t('results.evidence')}>
          <EvidenceList evidence={rotation.evidence} />
        </Section>
        <Section title={t('results.gaps')}>
          <InfoGaps gaps={rotation.informationGaps} />
        </Section>
      </div>
    </Card>
  );
}
