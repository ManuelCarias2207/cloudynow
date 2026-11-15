import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils.js';
import Card from '../ui/Card.jsx';
import RainfallChart from './RainfallChart.jsx';
import SoilMoistureChart from './SoilMoistureChart.jsx';
import TermGlossary from './TermGlossary.jsx';

export default function ClimateCharts({ monthly, indicators, hasSoilMoisture, dataSource, chartHeight, className }) {
  const { t } = useTranslation();
  const period = dataSource?.period;
  return (
    <Card className={cn('space-y-4', className)}>
      <div>
        <h2 className="font-semibold">{t('charts.title')}</h2>
        <p className="text-xs text-muted">
          {period
            ? t('charts.sourcePeriod', { start: period.start.slice(0, 4), end: period.end.slice(0, 4) })
            : t('charts.source')}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <RainfallChart monthly={monthly} bareWindowMonths={indicators.bareWindowMonths} height={chartHeight} />
        <SoilMoistureChart
          monthly={monthly}
          bareWindowMonths={indicators.bareWindowMonths}
          hasSoilMoisture={hasSoilMoisture}
          height={chartHeight}
        />
      </div>
      <TermGlossary />
    </Card>
  );
}
