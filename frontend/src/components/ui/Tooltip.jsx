import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/utils.js';

const OPEN_DELAY_MS = 300;

/**
 * Short hint for a focusable child (button, link, input). Opens on hover after 300 ms, at once on keyboard focus or tap,
 * and closes on leave, blur or Esc.
 */
export default function Tooltip({ content, side = 'top', children, className }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const timer = useRef();

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = (delay) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <span
      className="relative inline-flex"
      onPointerEnter={(event) => event.pointerType === 'mouse' && show(OPEN_DELAY_MS)}
      onPointerLeave={hide}
      onFocus={() => show(0)}
      onBlur={hide}
      onKeyDown={(event) => event.key === 'Escape' && hide()}
    >
      {cloneElement(children, { 'aria-describedby': id })}
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 w-max max-w-60 -translate-x-1/2 rounded-md bg-ink px-3 py-2 text-xs font-normal text-cream shadow-raised transition-[opacity,translate] duration-150 ease-enter',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          open ? 'translate-y-0 opacity-100' : cn('invisible opacity-0', side === 'top' ? 'translate-y-1' : '-translate-y-1'),
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
