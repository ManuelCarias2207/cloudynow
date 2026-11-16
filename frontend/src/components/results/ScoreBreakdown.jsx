import { useTranslation } from 'react-i18next';
import { CRITERIA } from '../../lib/constants.js';
import { toPercent } from '../../lib/utils.js';

/** One bar per criterion (0-100), with the weight of the chosen priority. Bars grow in one after another. */
export default function ScoreBreakdown({ scores, weights }) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-2">
      {CRITERIA.map((criterion, index) => (
        <li key={criterion} className="text-xs">
          <div className="flex justify-between gap-2 text-muted">
            <span>
              <span className="font-medium text-ink">{t(`criteria.${criterion}`)}</span> ×{weights[criterion]}
            </span>
            <span className="text-ink tabular-nums">{toPercent(scores[criterion])}</span>
          </div>
          <div aria-hidden="true" className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full origin-left animate-grow rounded-full bg-brand"
              style={{ width: `${toPercent(scores[criterion])}%`, animationDelay: `${index * 40}ms` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
