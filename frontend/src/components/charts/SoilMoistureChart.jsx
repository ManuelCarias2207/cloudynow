import { useTranslation } from 'react-i18next';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, XAxis, YAxis } from 'recharts';
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

const MONTH_TICKS = Array.from({ length: 12 }, (_, index) => index + 1);

function mean(values) {
  const valid = values.filter((value) => value !== null && value !== undefined);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}

/** Hover box: soil wetness and temperature of the month, in plain words. */
function SoilTip({ entry, bare, showSoil }) {
  const { t } = useTranslation();
  const months = useMonthNames();
  const format = useNumberFormat();
  const soil = showSoil && entry.soilPct !== null;
  const soilNote = !soil ? null : entry.soilPct < 50 ? t('chartTip.soilLow') : entry.soilPct < 65 ? t('chartTip.soilMid') : t('chartTip.soilHigh');
  return (
    <ChartTip
      title={months.long(entry.month)}
      tag={bare.has(entry.month) ? t('charts.bareTag') : null}
      lines={[
        soil ? t('chartTip.soil', { pct: entry.soilPct }) : t('chartTip.temp', { temp: format.decimal(entry.tempC) }),
        soilNote,
        soil && t('chartTip.temp', { temp: format.decimal(entry.tempC) }),
        entry.tempC >= 28 && t('chartTip.hot'),
        bare.has(entry.month) && t('chartTip.bare'),
      ]}
    />
  );
}

export default function SoilMoistureChart({ monthly, bareWindowMonths, hasSoilMoisture, height = 140 }) {
  const { t } = useTranslation();
  const months = useMonthNames();
  const format = useNumberFormat();
  const animate = !usePrefersReducedMotion();

  const data = monthly.map((entry) => ({
    month: entry.month,
    tempC: entry.tempC,
    soilPct: entry.soilMoisture === null ? null : Math.round(entry.soilMoisture * 100),
  }));
  const showSoil = hasSoilMoisture && data.some((entry) => entry.soilPct !== null);
  const bare = new Set(bareWindowMonths);
  const shown = { soilPct: mean(data.map((entry) => entry.soilPct)), tempC: mean(data.map((entry) => entry.tempC)) };
  const tempText = `${format.decimal(shown.tempC)} °C`;

  return (
    <figure className="space-y-3">
      <ChartHeadline
        title={t('charts.soil.title')}
        label={showSoil ? t('charts.soil.average') : t('charts.soil.averageTemp')}
        value={showSoil ? `${format.integer(shown.soilPct)}%` : tempText}
        unit={showSoil ? `· ${tempText}` : null}
        caption={showSoil ? t('charts.soil.scale') : t('charts.soil.missing')}
      />
      <HoverLayer left={36} right={showSoil ? 36 : 0} render={(month) => <SoilTip entry={data.find((item) => item.month === month)} bare={bare} showSoil={showSoil} />}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="soil-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={CHART_COLORS.soil} stopOpacity={0.25} />
                <stop offset="100%" stopColor={CHART_COLORS.soil} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} strokeDasharray="2 4" />
            {[...bare].map((month) => (
              <ReferenceArea
                key={month}
                yAxisId="temp"
                x1={month - 0.5}
                x2={month + 0.5}
                fill={CHART_COLORS.bareSoft}
                fillOpacity={0.7}
                strokeOpacity={0}
                ifOverflow="hidden"
              />
            ))}
            <XAxis
              dataKey="month"
              type="number"
              domain={[0.5, 12.5]}
              ticks={MONTH_TICKS}
              tickFormatter={months.short}
              {...AXIS_PROPS}
            />
            <YAxis yAxisId="temp" width={36} domain={['dataMin - 2', 'dataMax + 2']} tickCount={4} unit="°" allowDecimals={false} {...AXIS_PROPS} />
            <YAxis yAxisId="soil" orientation="right" width={36} domain={[0, 100]} ticks={[0, 50, 100]} unit="%" hide={!showSoil} {...AXIS_PROPS} />
            {showSoil && (
              <Area
                yAxisId="soil"
                type="monotone"
                dataKey="soilPct"
                stroke={CHART_COLORS.soil}
                strokeWidth={2}
                fill="url(#soil-fill)"
                activeDot={false}
                isAnimationActive={animate}
                animationDuration={800}
              />
            )}
            <Line
              yAxisId="temp"
              type="monotone"
              dataKey="tempC"
              stroke={CHART_COLORS.temp}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              activeDot={false}
              isAnimationActive={animate}
              animationDuration={800}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </HoverLayer>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {showSoil && <LegendItem color={CHART_COLORS.soil} shape="line" label={t('charts.soil.soil')} />}
        <LegendItem color={CHART_COLORS.temp} shape="dashed" label={t('charts.soil.temp')} />
        <LegendItem color={CHART_COLORS.bareSoft} label={t('charts.bareLegend')} />
      </ul>
      <table className="sr-only">
        <caption>{t('charts.soil.title')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('charts.month')}</th>
            {showSoil && <th scope="col">{t('charts.soil.soil')} (%)</th>}
            <th scope="col">{t('charts.soil.temp')} (°C)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.month}>
              <th scope="row">
                {months.long(entry.month)}
                {bare.has(entry.month) ? ` (${t('charts.bareTag')})` : ''}
              </th>
              {showSoil && <td>{entry.soilPct ?? '–'}</td>}
              <td>{format.decimal(entry.tempC)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
