'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EmptyState } from './ui/Feedback';

function groupByMonth(expenses) {
  const buckets = {};
  expenses.forEach((exp) => {
    const date = new Date(exp.spentAt);
    const key = date.toLocaleString(undefined, { month: 'short', year: '2-digit' });
    buckets[key] = (buckets[key] || 0) + exp.amount;
  });
  // Preserve chronological order rather than insertion/object order.
  return Object.entries(buckets)
    .map(([month, total]) => ({ month, total, sortKey: new Date(`01 ${month}`).getTime() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ month, total }) => ({ month, total }));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-ink-raised border border-ink-border rounded-md px-3 py-2 text-sm">
      <p className="text-parchment font-medium">{label}</p>
      <p className="text-slate-muted tabular">{payload[0].value.toLocaleString()} XLM</p>
    </div>
  );
}

export default function MonthlyTrendChart({ expenses }) {
  const data = groupByMonth(expenses || []);

  if (data.length === 0) {
    return <EmptyState title="No trend data yet" description="Your monthly totals appear once you log expenses." />;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2530" vertical={false} />
          <XAxis dataKey="month" stroke="#5C6475" tick={{ fontSize: 12 }} axisLine={{ stroke: '#1F2530' }} />
          <YAxis stroke="#5C6475" tick={{ fontSize: 12 }} axisLine={{ stroke: '#1F2530' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212,162,76,0.08)' }} />
          <Bar dataKey="total" fill="#D4A24C" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
