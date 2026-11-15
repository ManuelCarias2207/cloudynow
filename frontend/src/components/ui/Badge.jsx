import { cn } from '../../lib/utils.js';

const TONES = {
  neutral: 'bg-surface-2 text-ink',
  good: 'bg-brand-soft text-brand',
  warn: 'bg-maize-soft text-maize-ink',
};

export default function Badge({ tone = 'neutral', className, ...props }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)} {...props} />;
}
