import { CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

/** Contiguous runs of bare months as [startLabel, endLabel] pairs for shading. */
function bareRanges(monthly, bareWindowMonths) {
  const bare = new Set(bareWindowMonths);
  const ranges = [];
  monthly.forEach((entry, index) => {
    if (!bare.has(entry.month)) return;
    const previous = monthly[index - 1];
    if (previous && bare.has(previous.month)) ranges[ranges.length - 1][1] = entry.label;
    else ranges.push([entry.label, entry.label]);
  });
  return ranges;
}

export default function SoilMoistureChart({ monthly, bareWindowMonths, hasSoilMoisture }) {
  const data = monthly.map((entry) => ({
    ...entry,
    soilPct: entry.soilMoisture === null ? null : Math.round(entry.soilMoisture * 100),
  }));
  return (
    <div>
      <h3 className="text-sm font-semibold">Soil moisture and temperature</h3>
      <p className="mb-2 text-xs text-zinc-500">
        {hasSoilMoisture ? 'Root-zone soil wetness (0% dry, 100% saturated)' : 'Soil moisture is not available for this point'} and
        mean air temperature. The shaded area is the bare-field window.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -4 }}>
          <CartesianGrid vertical={false} stroke="#e4e4e7" />
          {bareRanges(monthly, bareWindowMonths).map(([start, end]) => (
            <ReferenceArea key={start} yAxisId="soil" x1={start} x2={end} fill="#fde68a" fillOpacity={0.5} />
          ))}
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis yAxisId="soil" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={11} unit="%" width={48} />
          <YAxis yAxisId="temp" orientation="right" tickLine={false} axisLine={false} fontSize={11} unit="°C" width={44} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip formatter={(value, name) => (name === 'Soil moisture' ? `${value}%` : `${value} °C`)} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />
          {hasSoilMoisture && (
            <Line yAxisId="soil" type="monotone" dataKey="soilPct" name="Soil moisture" stroke="#65a30d" strokeWidth={2} dot={false} />
          )}
          <Line yAxisId="temp" type="monotone" dataKey="tempC" name="Temperature" stroke="#e11d48" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
