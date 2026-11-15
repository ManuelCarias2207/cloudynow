import { useCallback, useEffect, useMemo, useState } from 'react';
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
