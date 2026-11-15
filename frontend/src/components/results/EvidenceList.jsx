import { useTranslation } from 'react-i18next';
import { CRITERIA } from '../../lib/constants.js';

/** NASA indicators behind each score. */
export default function EvidenceList({ evidence }) {
  const { t } = useTranslation();
  return (
    <ul className="space-y-1 text-xs text-muted">
      {CRITERIA.map((criterion) => (
        <li key={criterion}>
          <span className="font-medium text-ink">{t(`criteria.${criterion}`)}:</span>{' '}
          {Object.entries(evidence[criterion].indicators)
            .map(([name, value]) => `${t(`indicators.${name}`, name)} ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`)
            .join(' · ')}
          <span className="text-muted"> ({evidence[criterion].source})</span>
        </li>
      ))}
    </ul>
  );
}
