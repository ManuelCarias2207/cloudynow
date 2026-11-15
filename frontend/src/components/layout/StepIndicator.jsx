import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils.js';

export default function StepIndicator({ current }) {
  const { t } = useTranslation();
  return (
    <ol className="mb-6 flex gap-2 text-xs">
      {t('steps', { returnObjects: true }).map((step, index) => (
        <li
          key={step}
          className={cn('rounded-full px-3 py-1', index === current ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500')}
        >
          {index + 1}. {step}
        </li>
      ))}
    </ol>
  );
}
