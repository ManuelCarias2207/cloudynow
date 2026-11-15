import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '../ui/icons.jsx';
import { cn } from '../../lib/utils.js';

const STEP_PATHS = ['/zone', '/farm', '/results'];

/** Completed steps link back; the current one is marked with aria-current. */
/** `compact` hides the step pills on phones and keeps only the "Step 1 of 3" text. */
export default function StepIndicator({ current, compact = false }) {
  const { t } = useTranslation();
  const steps = t('steps', { returnObjects: true });
  return (
    <nav aria-label={t('stepper.label')} className="mb-6">
      <p className="mb-2 text-xs font-medium text-muted">{t('stepper.progress', { current: current + 1, total: steps.length })}</p>
      <ol className={cn('flex-wrap gap-2 text-sm', compact ? 'hidden md:flex' : 'flex')}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const marker = (
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                active && 'bg-accent text-accent-ink',
                done && 'bg-brand text-white',
                !active && !done && 'bg-surface text-muted ring-1 ring-line-strong',
              )}
            >
              {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
            </span>
          );
          const base = 'flex min-h-11 items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5';
          return (
            <li key={step}>
              {done ? (
                <Link to={STEP_PATHS[index]} className={cn(base, 'bg-brand-soft text-brand underline-offset-4 hover:underline')}>
                  {marker}
                  {step}
                  <span className="sr-only">{t('stepper.done')}</span>
                </Link>
              ) : (
                <span aria-current={active ? 'step' : undefined} className={cn(base, active ? 'bg-brand font-medium text-white' : 'text-muted')}>
                  {marker}
                  {step}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
