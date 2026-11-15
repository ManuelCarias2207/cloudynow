import { useTranslation } from 'react-i18next';
import { PRIORITIES } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';

export default function PriorityStep({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="font-medium">{t('farm.priorityTitle')}</h2>
      <p className="mb-3 text-sm text-zinc-500">{t('farm.priorityHint')}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {PRIORITIES.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={cn(
              'rounded-xl p-4 text-left ring-1 transition',
              value === id ? 'bg-zinc-900 text-white ring-zinc-900' : 'bg-white ring-zinc-200 hover:bg-zinc-100',
            )}
          >
            <span className="block text-sm font-medium">{t(`priorities.${id}.name`)}</span>
            <span className={cn('mt-1 block text-xs', value === id ? 'text-zinc-300' : 'text-zinc-500')}>{t(`priorities.${id}.hint`)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
