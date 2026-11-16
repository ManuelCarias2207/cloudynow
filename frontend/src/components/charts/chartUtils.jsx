import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export const CHART_COLORS = {
  rain: '#2f6f9a',
  bare: 'var(--color-maize)',
  bareSoft: 'var(--color-maize-soft)',
  soil: 'var(--color-brand)',
  temp: '#b45309',
  grid: 'var(--color-line)',
  axis: 'var(--color-muted)',
};

export const AXIS_PROPS = { tickLine: false, axisLine: false, fontSize: 11, stroke: CHART_COLORS.axis };

const MONTHS = Array.from({ length: 12 }, (_, index) => new Date(2024, index, 15));

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/\.$/, '');
}

/** Month names in the current UI language: short(1) -> "Jan" / "Ene", long(1) -> "January" / "Enero". */
export function useMonthNames() {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const shortFormat = new Intl.DateTimeFormat(i18n.language, { month: 'short' });
    const longFormat = new Intl.DateTimeFormat(i18n.language, { month: 'long' });
    const shortNames = MONTHS.map((date) => capitalize(shortFormat.format(date)));
    const longNames = MONTHS.map((date) => capitalize(longFormat.format(date)));
    return { short: (month) => shortNames[month - 1] ?? '', long: (month) => longNames[month - 1] ?? '' };
  }, [i18n.language]);
}

/** Number formatter in the current UI language. */
export function useNumberFormat() {
  const { i18n } = useTranslation();
  return useMemo(() => {
    const integer = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 });
    const decimal = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
    return { integer: (value) => integer.format(value), decimal: (value) => decimal.format(value) };
  }, [i18n.language]);
}

export function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.(query);
    if (!media) return undefined;
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Recharts tooltip content that renders nothing and reports the hovered month to the headline. */
export function ActiveMonthSync({ active, payload, onChange }) {
  const month = active ? (payload?.[0]?.payload?.month ?? null) : null;
  useEffect(() => {
    onChange(month);
  }, [month, onChange]);
  return null;
}

/** Hovered or keyboard-focused month, plus a stable Recharts tooltip `content` that reports it. */
export function useActiveMonth() {
  const [activeMonth, setActiveMonth] = useState(null);
  const tooltipContent = useCallback(
    ({ active, payload }) => <ActiveMonthSync active={active} payload={payload} onChange={setActiveMonth} />,
    [],
  );
  return [activeMonth, tooltipContent];
}

/** Arc-style readout above a chart: small label, large value, caption. */
export function ChartHeadline({ title, label, value, unit, caption, tag }) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div aria-live="polite">
        <p className="text-xs text-muted">{label}</p>
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-xl font-semibold tabular-nums">{value}</span>
          {unit && <span className="text-sm text-muted">{unit}</span>}
          {tag && <span className="rounded-full bg-maize-soft px-2 text-xs font-medium text-maize-ink">{tag}</span>}
        </p>
        {caption && <p className="text-xs text-muted">{caption}</p>}
      </div>
    </div>
  );
}

export function LegendItem({ color, shape = 'block', label }) {
  const swatch =
    shape === 'line' ? (
      <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: color }} />
    ) : shape === 'dashed' ? (
      <span className="w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
    ) : (
      <span className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
    );
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className="flex items-center">
        {swatch}
      </span>
      {label}
    </li>
  );
}

/** Floating box that follows the cursor over a chart: month title and plain-language lines. */
export function ChartTip({ title, tag, lines }) {
  return (
    <div className="pointer-events-none w-64 rounded-md bg-ink px-3 py-2.5 text-xs text-cream shadow-raised">
      <p className="flex items-center justify-between gap-2 text-sm font-semibold">
        {title}
        {tag && <span className="rounded-full bg-maize px-2 py-0.5 text-[0.7rem] font-medium text-ink">{tag}</span>}
      </p>
      <ul className="mt-1 grid gap-1 text-pretty">
        {lines.filter(Boolean).map((line, index) => (
          <li key={index} className={index === 0 ? 'font-medium text-white' : 'text-cream/85'}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Recharts tooltip props for a box that follows the cursor without sliding or highlighting. */
export const STILL_TOOLTIP = { cursor: false, isAnimationActive: false, offset: 18, allowEscapeViewBox: { x: false, y: true }, wrapperStyle: { zIndex: 20, outline: 'none' } };

const TIP_WIDTH = 256;

/**
 * Wraps a 12-month chart and shows `render(month)` in a box next to the cursor. The hover state lives here,
 * so the chart itself never re-renders (and never re-animates) while the mouse moves.
 * `left`/`right` are the axis widths at each side of the plot area.
 */
export function HoverLayer({ left = 0, right = 0, render, children }) {
  const ref = useRef(null);
  const [hover, setHover] = useState(null);
  const onMove = (event) => {
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const plot = rect.width - left - right;
    const month = Math.floor(((x - left) / plot) * 12) + 1;
    if (month < 1 || month > 12) return setHover(null);
    const flip = x + 16 + TIP_WIDTH > rect.width;
    setHover({ month, x: flip ? x - 16 - TIP_WIDTH : x + 16, y: Math.max(event.clientY - rect.top - 24, 0) });
  };
  return (
    <div ref={ref} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <div aria-hidden="true">{children}</div>
      {hover && (
        <div className="pointer-events-none absolute z-30" style={{ left: hover.x, top: hover.y, width: TIP_WIDTH }}>
          {render(hover.month)}
        </div>
      )}
    </div>
  );
}
