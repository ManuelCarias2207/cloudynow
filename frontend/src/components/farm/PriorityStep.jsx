import { useTranslation } from 'react-i18next';
import { PRIORITIES } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';

export default function PriorityStep({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <section>
      <h2 className="font-medium">{t('farm.priorityTitle')}</h2>
      <p className="mb-3 text-sm text-muted">{t('farm.priorityHint')}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {PRIORITIES.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
            className={cn(
              'cursor-pointer rounded-md p-4 text-left ring-1',
              value === id ? 'bg-brand text-white ring-brand' : 'bg-surface ring-line-strong hover:bg-surface-2',
            )}
          >
            <span className="block text-sm font-medium">{t(`priorities.${id}.name`)}</span>
            <span className={cn('mt-1 block text-xs', value === id ? 'text-on-brand-muted' : 'text-muted')}>{t(`priorities.${id}.hint`)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
