'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import { useRequireRole } from '../../lib/useRequireRole';
import DashboardShell from '../../components/DashboardShell';
import Panel from '../../components/ui/Panel';
import { PanelSkeleton, EmptyState } from '../../components/ui/Feedback';
import ErrorBoundary from '../../components/ErrorBoundary';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateHash(hash) {
  if (!hash) return '—';
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export default function UniversityDashboardPage() {
  const { ready } = useRequireRole('university');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: dashboard } = await api.get('/users/university-dashboard');
      setData(dashboard);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) fetchDashboard();
  }, [ready, fetchDashboard]);

  if (!ready) return null;

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-1">University dashboard</h1>
      <p className="text-slate-muted mb-8">Tuition payments received from students, on-chain.</p>

      {loading && (
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {[0, 1].map((i) => (
            <Panel key={i}>
              <PanelSkeleton rows={2} />
            </Panel>
          ))}
        </div>
      )}

      {!loading && error && (
        <Panel className="p-6 mb-8 border-coral/40">
          <p className="text-coral text-sm">{error}</p>
        </Panel>
      )}

      {!loading && !error && data && (
        <ErrorBoundary>
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <Panel className="p-6">
              <p className="text-sm text-slate-muted mb-1">Total received</p>
              <p className="font-display text-3xl tabular">{data.totalReceived.toLocaleString()} XLM</p>
            </Panel>
            <Panel className="p-6">
              <p className="text-sm text-slate-muted mb-1">Payments</p>
              <p className="font-display text-3xl tabular">{data.payments.length}</p>
            </Panel>
          </div>

          <Panel className="p-6">
            <p className="font-display text-lg mb-4">Payment history</p>
            {data.payments.length === 0 ? (
              <EmptyState
                title="No payments yet"
                description="Once a student pays tuition through their wallet, it appears here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-faint border-b border-ink-border">
                      <th className="py-2.5 pr-4 font-medium">Student</th>
                      <th className="py-2.5 pr-4 font-medium">Amount</th>
                      <th className="py-2.5 pr-4 font-medium">Date</th>
                      <th className="py-2.5 pr-4 font-medium">Tx hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payments.map((p) => (
                      <tr key={p._id} className="border-b border-ink-border/60 last:border-0">
                        <td className="py-3 pr-4 text-parchment">
                          {p.fromUser?.name} <span className="text-slate-faint">({p.fromUser?.email})</span>
                        </td>
                        <td className="py-3 pr-4 tabular text-parchment">
                          {p.amount.toLocaleString()} {p.assetCode}
                        </td>
                        <td className="py-3 pr-4 text-slate-muted tabular">{formatDate(p.createdAt)}</td>
                        <td className="py-3 pr-4">
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${p.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="tabular text-signal-gold hover:underline"
                          >
                            {truncateHash(p.txHash)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </ErrorBoundary>
      )}
    </DashboardShell>
  );
}
