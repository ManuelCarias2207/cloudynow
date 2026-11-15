import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const BARE_COLOR = '#f59e0b';
const RAIN_COLOR = '#0ea5e9';

export default function RainfallChart({ monthly, bareWindowMonths }) {
  const bare = new Set(bareWindowMonths);
  return (
    <div>
      <h3 className="text-sm font-semibold">Monthly rainfall</h3>
      <p className="mb-2 text-xs text-zinc-500">
        Average total per month, in mm. <span className="font-medium text-amber-700">Orange bars</span> are the bare-field window.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthly} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="#e4e4e7" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
          <Tooltip
            cursor={{ fill: '#f4f4f5' }}
            formatter={(value, _name, item) => [`${value} mm${bare.has(item.payload.month) ? ' (bare field)' : ''}`, 'Rain']}
          />
          <Bar dataKey="rainMm" radius={[4, 4, 0, 0]}>
            {monthly.map((entry) => (
              <Cell key={entry.month} fill={bare.has(entry.month) ? BARE_COLOR : RAIN_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
