import { useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils.js';

/**
 * Segmented tabs with a sliding highlight. items: [{ id, label, content? }].
 * Controlled with `value` + `onChange`, or uncontrolled with `defaultValue`. Arrow keys, Home and End move between tabs.
 * When items carry `content`, the active panel renders below the list.
 */
export default function Tabs({ items, value, defaultValue, onChange, label, className, listClassName }) {
  const base = useId();
  const [own, setOwn] = useState(defaultValue ?? items[0]?.id);
  const active = value ?? own;
  const listRef = useRef(null);
  const [highlight, setHighlight] = useState(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const measure = () => {
      const tab = list.querySelector('[aria-selected="true"]');
      if (tab) setHighlight({ left: tab.offsetLeft, width: tab.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active, items]);

  const select = (id) => {
    if (value === undefined) setOwn(id);
    onChange?.(id);
  };

  const onKeyDown = (event) => {
    const index = items.findIndex((item) => item.id === active);
    const next = {
      ArrowRight: (index + 1) % items.length,
      ArrowLeft: (index - 1 + items.length) % items.length,
      Home: 0,
      End: items.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(items[next].id);
    listRef.current.querySelectorAll('[role="tab"]')[next].focus();
  };

  const current = items.find((item) => item.id === active);

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className={cn('relative isolate inline-flex max-w-full gap-1 overflow-x-auto rounded-md bg-surface-2 p-1 ring-1 ring-line', listClassName)}
      >
        {highlight && (
          <span
            aria-hidden="true"
            className="absolute inset-y-1 left-0 -z-10 rounded-sm bg-surface shadow-resting ring-1 ring-line transition-[translate,width] duration-200 ease-standard"
            style={{ width: highlight.width, translate: `${highlight.left}px 0` }}
          />
        )}
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={item.content !== undefined ? `${base}-panel-${item.id}` : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              className={cn(
                'min-h-9 shrink-0 cursor-pointer rounded-sm px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150',
                selected ? 'text-brand' : 'text-muted hover:text-ink',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {current?.content !== undefined && (
        <div
          key={current.id}
          role="tabpanel"
          id={`${base}-panel-${current.id}`}
          aria-labelledby={`${base}-tab-${current.id}`}
          tabIndex={0}
          className="mt-4 animate-enter rounded-md"
        >
          {current.content}
        </div>
      )}
    </div>
  );
}
