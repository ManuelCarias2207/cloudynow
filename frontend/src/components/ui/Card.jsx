import { cn } from '../../lib/utils.js';

/**
 * `selected` draws the brand ring. `interactive` lifts the card on hover (pointer only). `enter` fades it in; siblings stagger by 60 ms.
 */
export default function Card({ selected = false, interactive = false, enter = false, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg bg-surface p-5 transition-[box-shadow,translate] duration-200 ease-standard',
        selected ? 'shadow-raised ring-2 ring-brand' : 'ring-1 ring-line',
        interactive && 'hover:-translate-y-0.5 hover:shadow-raised',
        interactive && !selected && 'hover:ring-line-strong',
        enter && 'animate-enter [&:nth-child(2)]:[animation-delay:60ms] [&:nth-child(3)]:[animation-delay:120ms] [&:nth-child(4)]:[animation-delay:180ms]',
        className,
      )}
      {...props}
    />
  );
}
