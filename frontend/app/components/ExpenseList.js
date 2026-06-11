'use client';

import { useState } from 'react';
import api from '../lib/api';
import { EmptyState } from './ui/Feedback';
import Button from './ui/Button';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const categoryLabel = (key) => key.charAt(0).toUpperCase() + key.slice(1);

export default function ExpenseList({ expenses, onDeleted }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/expenses/${id}`);
      onDeleted(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (!expenses || expenses.length === 0) {
    return (
      <EmptyState
        title="No expenses logged"
        description="Add your first expense to start tracking where your funds go."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-faint border-b border-ink-border">
            <th className="py-2.5 pr-4 font-medium">Category</th>
            <th className="py-2.5 pr-4 font-medium">Note</th>
            <th className="py-2.5 pr-4 font-medium">Amount</th>
            <th className="py-2.5 pr-4 font-medium">Date</th>
            <th className="py-2.5 pr-4 font-medium" />
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp._id} className="border-b border-ink-border/60 last:border-0">
              <td className="py-3 pr-4 text-parchment">{categoryLabel(exp.category)}</td>
              <td className="py-3 pr-4 text-slate-muted">{exp.note || '—'}</td>
              <td className="py-3 pr-4 tabular text-parchment">{exp.amount.toLocaleString()} XLM</td>
              <td className="py-3 pr-4 text-slate-muted tabular">{formatDate(exp.spentAt)}</td>
              <td className="py-3 pr-4 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  loading={deletingId === exp._id}
                  onClick={() => handleDelete(exp._id)}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
