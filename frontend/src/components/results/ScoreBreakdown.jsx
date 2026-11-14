import { CRITERIA } from '../../lib/constants.js';
import { toPercent } from '../../lib/utils.js';

/** One bar per criterion (0-100), with the weight of the chosen priority. */
export default function ScoreBreakdown({ scores, weights }) {
  return (
    <ul className="space-y-1.5">
      {CRITERIA.map((criterion) => (
        <li key={criterion} className="text-xs">
          <div className="flex justify-between text-zinc-600">
            <span className="capitalize">
              {criterion} <span className="text-zinc-400">×{weights[criterion]}</span>
            </span>
            <span>{toPercent(scores[criterion])}</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-zinc-100">
            <div className="h-1.5 rounded-full bg-zinc-800" style={{ width: `${toPercent(scores[criterion])}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
