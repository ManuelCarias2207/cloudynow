import { cn } from '../../lib/utils.js';

const VARIANTS = {
  primary: 'bg-brand text-white hover:bg-brand-hover disabled:bg-brand/15 disabled:text-brand',
  secondary: 'bg-surface text-ink ring-1 ring-line-strong hover:bg-surface-2 disabled:text-muted',
};

export default function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-transform duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
