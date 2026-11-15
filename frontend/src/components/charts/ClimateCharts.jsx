import Card from '../ui/Card.jsx';
import RainfallChart from './RainfallChart.jsx';
import SoilMoistureChart from './SoilMoistureChart.jsx';
import TermGlossary from './TermGlossary.jsx';

export default function ClimateCharts({ monthly, indicators, hasSoilMoisture, dataSource }) {
  const period = dataSource?.period ? ` (${dataSource.period.start.slice(0, 4)}–${dataSource.period.end.slice(0, 4)})` : '';
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="font-semibold">Climate and soil here</h2>
        <p className="text-xs text-zinc-500">Monthly averages from NASA POWER{period}.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <RainfallChart monthly={monthly} bareWindowMonths={indicators.bareWindowMonths} />
        <SoilMoistureChart monthly={monthly} bareWindowMonths={indicators.bareWindowMonths} hasSoilMoisture={hasSoilMoisture} />
      </div>
      <TermGlossary />
    </Card>
  );
}
