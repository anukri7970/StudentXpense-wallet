'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { EmptyState } from './ui/Feedback';

const CATEGORY_COLORS = {
  food: '#D4A24C',
  books: '#3FB78A',
  transport: '#7C9CD4',
  rent: '#E2685B',
  fees: '#B786D8',
  other: '#8B93A3',
};

const categoryLabel = (key) => key.charAt(0).toUpperCase() + key.slice(1);

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-ink-raised border border-ink-border rounded-md px-3 py-2 text-sm">
      <p className="text-parchment font-medium">{categoryLabel(entry.name)}</p>
      <p className="text-slate-muted tabular">{entry.value.toLocaleString()} XLM</p>
    </div>
  );
}

export default function ExpensePieChart({ categoryBreakdown }) {
  const data = Object.entries(categoryBreakdown || {}).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  if (data.length === 0) {
    return (
      <EmptyState
        title="No spending logged yet"
        description="Add an expense to see your category breakdown here."
      />
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#8B93A3'} stroke="#0B0E14" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => categoryLabel(value)}
            wrapperStyle={{ fontSize: 12, color: '#8B93A3' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
