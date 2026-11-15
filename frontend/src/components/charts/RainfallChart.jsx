import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AXIS_PROPS,
  CHART_COLORS,
  ChartHeadline,
  LegendItem,
  useMonthNames,
  useNumberFormat,
  useActiveMonth,
  usePrefersReducedMotion,
} from './chartUtils.jsx';

export default function RainfallChart({ monthly, bareWindowMonths, height = 140 }) {
  const { t } = useTranslation();
  const months = useMonthNames();
  const format = useNumberFormat();
  const animate = !usePrefersReducedMotion();
  const [activeMonth, tooltipContent] = useActiveMonth();

  const bare = new Set(bareWindowMonths);
  const total = monthly.reduce((sum, entry) => sum + (entry.rainMm ?? 0), 0);
  const average = total / monthly.length;
  const active = monthly.find((entry) => entry.month === activeMonth);
  const sorted = [...monthly].sort((a, b) => b.rainMm - a.rainMm);

  return (
    <figure className="space-y-3">
      <ChartHeadline
        title={t('charts.rain.title')}
        label={active ? months.long(active.month) : t('charts.rain.total')}
        value={format.integer(active ? active.rainMm : total)}
        unit="mm"
        tag={active && bare.has(active.month) ? t('charts.bareTag') : null}
        caption={active ? null : t('charts.rain.hint')}
      />
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={monthly} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="2 4" />
            <XAxis dataKey="month" tickFormatter={months.short} {...AXIS_PROPS} />
            <YAxis orientation="right" width={36} tickCount={4} {...AXIS_PROPS} />
            <ReferenceLine
              y={average}
              stroke={CHART_COLORS.axis}
              strokeDasharray="3 3"
              label={{ value: t('charts.avg'), position: 'insideTopLeft', fontSize: 10, fill: CHART_COLORS.axis }}
            />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-2)', opacity: 0.6 }}
              wrapperStyle={{ display: 'none' }}
              content={tooltipContent}
            />
            <Bar dataKey="rainMm" maxBarSize={28} radius={[3, 3, 0, 0]} isAnimationActive={animate} animationDuration={700}>
              {monthly.map((entry) => (
                <Cell
                  key={entry.month}
                  fill={bare.has(entry.month) ? CHART_COLORS.bare : CHART_COLORS.rain}
                  fillOpacity={activeMonth && activeMonth !== entry.month ? 0.45 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <LegendItem color={CHART_COLORS.rain} label={t('charts.rain.series')} />
        <LegendItem color={CHART_COLORS.bare} label={t('charts.bareLegend')} />
      </ul>
      <table className="sr-only">
        <caption>
          {t('charts.rain.summary', {
            total: format.integer(total),
            wettest: months.long(sorted[0].month),
            driest: months.long(sorted[sorted.length - 1].month),
          })}
        </caption>
        <thead>
          <tr>
            <th scope="col">{t('charts.month')}</th>
            <th scope="col">{t('charts.rain.series')} (mm)</th>
          </tr>
        </thead>
        <tbody>
          {monthly.map((entry) => (
            <tr key={entry.month}>
              <th scope="row">{months.long(entry.month)}</th>
              <td>
                {format.integer(entry.rainMm)}
                {bare.has(entry.month) ? ` (${t('charts.bareTag')})` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
