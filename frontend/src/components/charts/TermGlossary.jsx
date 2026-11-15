import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils.js';

const TERMS = ['bareWindow', 'soilMoisture', 'drySpell'];

export default function TermGlossary() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(null);
  const panelId = useId();

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted">{t('charts.glossary.title')}</span>
        {TERMS.map((key) => (
          <button
            key={key}
            type="button"
            aria-expanded={open === key}
            aria-controls={panelId}
            onClick={() => setOpen(open === key ? null : key)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
              open === key ? 'bg-brand text-white ring-brand' : 'bg-surface text-ink ring-line-strong hover:bg-surface-2',
            )}
          >
            {t(`charts.glossary.${key}.term`)}
          </button>
        ))}
      </div>
      <p id={panelId} aria-live="polite" className={cn('rounded-md bg-surface-2 px-3 py-2 text-muted', !open && 'sr-only')}>
        {open && t(`charts.glossary.${open}.text`)}
      </p>
    </div>
  );
}
