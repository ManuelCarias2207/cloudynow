import { useTranslation } from 'react-i18next';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import {
  AXIS_PROPS,
  CHART_COLORS,
  ChartHeadline,
  LegendItem,
  useMonthNames,
  useNumberFormat,
  ChartTip,
  HoverLayer,
  usePrefersReducedMotion,
} from './chartUtils.jsx';

/** Hover box: rain of the month compared with a typical month, in plain words. */
function RainTip({ entry, average, bare, wettest, driest }) {
  const { t } = useTranslation();
  const months = useMonthNames();
  const format = useNumberFormat();
  const ratio = entry.rainMm / average;
  const compare = ratio > 1.15 ? 'wetter' : ratio < 0.85 ? 'drier' : 'same';
  return (
    <ChartTip
      title={months.long(entry.month)}
      tag={bare.has(entry.month) ? t('charts.bareTag') : null}
      lines={[
        t('chartTip.rain', { mm: format.integer(entry.rainMm) }),
        entry.month === wettest ? t('chartTip.wettest') : entry.month === driest ? t('chartTip.driest') : t(`chartTip.vsAvg_${compare}`, { avg: format.integer(average) }),
        bare.has(entry.month) && t('chartTip.bare'),
      ]}
    />
  );
}

export default function RainfallChart({ monthly, bareWindowMonths, height = 140 }) {
  const { t } = useTranslation();
  const months = useMonthNames();
  const format = useNumberFormat();
  const animate = !usePrefersReducedMotion();

  const bare = new Set(bareWindowMonths);
  const total = monthly.reduce((sum, entry) => sum + (entry.rainMm ?? 0), 0);
  const average = total / monthly.length;
  const sorted = [...monthly].sort((a, b) => b.rainMm - a.rainMm);

  return (
    <figure className="space-y-3">
      <ChartHeadline
        title={t('charts.rain.title')}
        label={t('charts.rain.total')}
        value={format.integer(total)}
        unit="mm"
        caption={t('charts.rain.hint')}
      />
      <HoverLayer left={0} right={36} render={(month) => <RainTip entry={monthly.find((item) => item.month === month)} average={average} bare={bare} wettest={sorted[0].month} driest={sorted[sorted.length - 1].month} />}>
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
            <Bar dataKey="rainMm" maxBarSize={28} radius={[3, 3, 0, 0]} activeBar={false} isAnimationActive={animate} animationDuration={700}>
              {monthly.map((entry) => (
                <Cell
                  key={entry.month}
                  fill={bare.has(entry.month) ? CHART_COLORS.bare : CHART_COLORS.rain}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </HoverLayer>
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
