import { cn } from '../../lib/utils.js';

const VARIANTS = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-700 disabled:bg-zinc-300',
  secondary: 'bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-100 disabled:text-zinc-400',
};

export default function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}
