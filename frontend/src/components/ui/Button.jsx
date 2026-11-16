import { cn } from '../../lib/utils.js';

const VARIANTS = {
  primary:
    'bg-brand text-white shadow-resting hover:bg-brand-hover hover:shadow-raised disabled:bg-brand/15 disabled:text-brand disabled:shadow-none',
  secondary: 'bg-surface text-ink ring-1 ring-line-strong hover:bg-surface-2 hover:shadow-resting disabled:bg-surface-2 disabled:text-muted',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink disabled:text-muted',
};

const SIZES = {
  sm: 'min-h-9 rounded-sm px-3 text-sm',
  md: 'min-h-11 rounded-md px-4 text-sm',
  lg: 'min-h-12 rounded-md px-5 text-base',
};

/** While `loading`, the button keeps focus and its width, shows a spinner and ignores presses. */
export default function Button({ variant = 'primary', size = 'md', loading = false, className, children, onClick, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex cursor-pointer items-center justify-center gap-2 font-medium select-none transition-[background-color,color,box-shadow,scale] duration-150 ease-standard active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100',
        loading && 'cursor-progress active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (event) => event.preventDefault() : onClick}
      {...props}
    >
      {loading && (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
          <span className="size-4 animate-spin rounded-full border-[1.5px] border-current border-r-transparent" />
        </span>
      )}
      <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>{children}</span>
    </button>
  );
}
