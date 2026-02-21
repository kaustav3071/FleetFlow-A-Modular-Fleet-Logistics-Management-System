import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316', '#EC4899'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-800 border border-surface-700 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-sm font-medium text-white">{payload[0].name}</p>
      <p className="text-xs text-surface-400">{payload[0].value.toLocaleString('en-IN')}</p>
    </div>
  );
};

export default function DonutChart({ data, height = 280, title, centerLabel, centerValue }) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div className="glass-card p-5">
      {title && <h3 className="section-title mb-4">{title}</h3>}
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-white">{centerValue ?? total.toLocaleString('en-IN')}</p>
          {centerLabel && <p className="text-xs text-surface-500 uppercase tracking-wide">{centerLabel}</p>}
        </div>
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-xs text-surface-400 truncate">{d.name}</span>
            <span className="text-xs text-surface-500 ml-auto">{d.value?.toLocaleString('en-IN')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
