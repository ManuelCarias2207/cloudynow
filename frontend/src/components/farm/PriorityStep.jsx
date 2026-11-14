import { PRIORITIES } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';

export default function PriorityStep({ value, onChange }) {
  return (
    <section>
      <h2 className="font-medium">What matters most to you?</h2>
      <p className="mb-3 text-sm text-zinc-500">This changes how much each score weighs.</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {PRIORITIES.map((priority) => (
          <button
            key={priority.id}
            type="button"
            onClick={() => onChange(priority.id)}
            className={cn(
              'rounded-xl p-4 text-left ring-1 transition',
              value === priority.id ? 'bg-zinc-900 text-white ring-zinc-900' : 'bg-white ring-zinc-200 hover:bg-zinc-100',
            )}
          >
            <span className="block text-sm font-medium">{priority.name}</span>
            <span className={cn('mt-1 block text-xs', value === priority.id ? 'text-zinc-300' : 'text-zinc-500')}>{priority.hint}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
