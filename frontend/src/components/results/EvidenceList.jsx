import { CRITERIA } from '../../lib/constants.js';

/** NASA indicators behind each score. */
export default function EvidenceList({ evidence }) {
  return (
    <ul className="space-y-1 text-xs text-zinc-600">
      {CRITERIA.map((criterion) => (
        <li key={criterion}>
          <span className="font-medium capitalize text-zinc-800">{criterion}:</span>{' '}
          {Object.entries(evidence[criterion].indicators)
            .map(([name, value]) => `${name} ${Array.isArray(value) ? `[${value.join(', ')}]` : value}`)
            .join(' · ')}
          <span className="text-zinc-400"> ({evidence[criterion].source})</span>
        </li>
      ))}
    </ul>
  );
}
