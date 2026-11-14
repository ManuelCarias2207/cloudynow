import { cn } from '../../lib/utils.js';

const TONES = {
  neutral: 'bg-zinc-100 text-zinc-700',
  good: 'bg-lime-100 text-lime-800',
  warn: 'bg-amber-100 text-amber-800',
};

export default function Badge({ tone = 'neutral', className, ...props }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', TONES[tone], className)} {...props} />;
}
