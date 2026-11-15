import { useTranslation } from 'react-i18next';
import { CROPS, MAX_CROPS } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';

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
      <p className="mb-3 text-sm text-zinc-500">{t('farm.cropsHint', { max: MAX_CROPS })}</p>
      <div className="flex flex-wrap gap-2">
        {CROPS.map((id) => {
          const active = value.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id)}
              className={cn(
                'rounded-full px-3 py-1.5 text-sm ring-1 transition',
                active ? 'bg-zinc-900 text-white ring-zinc-900' : 'bg-white ring-zinc-200 hover:bg-zinc-100',
              )}
            >
              {t(`crops.${id}`)}
            </button>
          );
        })}
      </div>
    </section>
  );
}
