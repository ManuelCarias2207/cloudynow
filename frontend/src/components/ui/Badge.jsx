import { cn } from '../../lib/utils.js';

const TONES = {
  neutral: { body: 'bg-surface-2 text-ink', dot: 'bg-muted', ring: 'ring-line-strong/40' },
  good: { body: 'bg-brand-soft text-brand', dot: 'bg-brand', ring: 'ring-brand/25' },
  warn: { body: 'bg-maize-soft text-maize-ink', dot: 'bg-maize', ring: 'ring-maize/50' },
  danger: { body: 'bg-danger/10 text-danger', dot: 'bg-danger', ring: 'ring-danger/25' },
};

const SIZES = {
  sm: 'min-h-5 gap-1 rounded-[5px] px-2 text-[11px]',
  md: 'min-h-6 gap-1.5 rounded-[6px] px-2.5 text-xs',
};

export default function Badge({ tone = 'neutral', size = 'md', dot = false, outline = false, pill = false, className, children, ...props }) {
  const style = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center leading-none font-medium whitespace-nowrap tabular-nums',
        style.body,
        SIZES[size],
        outline && `ring-1 ${style.ring}`,
        pill && 'rounded-full',
        className,
      )}
      {...props}
    >
      {dot && <span aria-hidden="true" className={cn('size-1.5 rounded-full', style.dot)} />}
      {children}
    </span>
  );
}
