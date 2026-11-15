import { useTranslation } from 'react-i18next';
import { CROPS, MAX_CROPS } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';
import { CheckIcon } from '../ui/icons.jsx';

/** Multi-select of the crops in the current rotation (in planting order). */
export default function CropStep({ value, onChange }) {
  const { t } = useTranslation();
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((crop) => crop !== id));
    else if (value.length < MAX_CROPS) onChange([...value, id]);
  };
  return (
    <section>
      <h2 className="font-medium">{t('farm.cropsTitle')}</h2>
      <p className="mb-3 text-sm text-muted">{t('farm.cropsHint', { max: MAX_CROPS })}</p>
      <div className="flex flex-wrap gap-2">
        {CROPS.map((id) => {
          const active = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(id)}
              className={cn(
                'inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm ring-1',
                active ? 'bg-brand text-white ring-brand' : 'bg-surface ring-line-strong hover:bg-surface-2',
              )}
            >
              {active && <CheckIcon className="h-3.5 w-3.5" />}
              {t(`crops.${id}`)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
