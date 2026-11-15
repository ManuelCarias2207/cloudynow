import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils.js';

const pulse = 'animate-pulse-soft bg-line/70';

/**
 * Text-shaped placeholder: a short title line, full lines and a shorter last line, each pulsing a beat after the one above.
 * With children, shows them (fading in) once `loading` is false.
 */
export default function Skeleton({ lines = 3, avatar = false, loading = true, label, className, children }) {
  const { t } = useTranslation();
  if (children !== undefined && !loading) return <div className="animate-enter">{children}</div>;
  const count = Math.min(Math.max(Math.floor(lines), 1), 6);
  return (
    <div role="status" aria-busy="true" aria-label={label ?? t('ui.loading')} className={cn('flex w-full items-start gap-4', className)}>
      {avatar && <span aria-hidden="true" className={cn(pulse, 'size-11 shrink-0 rounded-full')} />}
      <span aria-hidden="true" className="grid flex-1 gap-3 pt-1">
        {Array.from({ length: count }, (_, index) => (
          <span
            key={index}
            className={cn(pulse, 'block h-3 w-full rounded-sm first:h-4 first:w-[48%]', count > 2 && 'last:w-[72%]')}
            style={{ animationDelay: `${(index + (avatar ? 1 : 0)) * 90}ms` }}
          />
        ))}
      </span>
    </div>
  );
}

/** Solid placeholder for a chart, a map label or any box: give it its size with className. */
export function SkeletonBlock({ label, className }) {
  const { t } = useTranslation();
  return <span role="status" aria-busy="true" aria-label={label ?? t('ui.loading')} className={cn(pulse, 'block rounded-md', className)} />;
}
