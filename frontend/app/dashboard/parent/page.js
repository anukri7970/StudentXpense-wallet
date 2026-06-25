'use client';

import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../lib/api';
import { useRequireRole } from '../../lib/useRequireRole';
import DashboardShell from '../../components/DashboardShell';
import Panel from '../../components/ui/Panel';
import { PanelSkeleton } from '../../components/ui/Feedback';
import Toast from '../../components/ui/Toast';
import SendFundsForm from '../../components/SendFundsForm';
import LinkStudentForm from '../../components/LinkStudentForm';
import TransactionList from '../../components/TransactionList';
import ErrorBoundary from '../../components/ErrorBoundary';
import ConnectWallet from '../../components/ConnectWallet';

export default function ParentDashboardPage() {
  const { ready } = useRequireRole('parent');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: dashboard } = await api.get('/users/parent-dashboard');
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

  const handleSent = (result) => {
    setToast({ message: `Sent successfully. Escrow balance: ${result.escrowBalance} stroops.`, tone: 'mint' });
    fetchDashboard();
  };

  const handleLinked = () => {
    setToast({ message: 'Student linked.', tone: 'mint' });
    fetchDashboard();
  };

  if (!ready) return null;

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-1">Parent dashboard</h1>
      <p className="text-slate-muted mb-8">Send funds and track where they went.</p>

      {loading && (
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {[0, 1, 2].map((i) => (
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
          <div className="grid md:grid-cols-4 gap-5 mb-8">
            <Panel className="p-6 bg-slate-800/80 border-mint/20">
              <p className="text-sm text-slate-muted mb-1 text-mint">Live balance</p>
              <p className="font-display text-3xl tabular">{data.liveXlmBalance !== null ? data.liveXlmBalance.toLocaleString() : '--'} XLM</p>
            </Panel>
            <Panel className="p-6">
              <p className="text-sm text-slate-muted mb-1">Total sent</p>
              <p className="font-display text-3xl tabular">{data.totalSent.toLocaleString()} XLM</p>
            </Panel>
            <Panel className="p-6">
              <p className="text-sm text-slate-muted mb-1">Students linked</p>
              <p className="font-display text-3xl tabular">{data.studentsLinked.length}</p>
            </Panel>
            <Panel className="p-6">
              <p className="text-sm text-slate-muted mb-1">Transfers</p>
              <p className="font-display text-3xl tabular">{data.transactions.length}</p>
            </Panel>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mb-8">
            <div className="lg:col-span-2 flex flex-col gap-5">
              <SendFundsForm students={data.studentsLinked} onSuccess={handleSent} />
            </div>
            <div className="flex flex-col gap-5">
              <LinkStudentForm onSuccess={handleLinked} />
              <ConnectWallet />
            </div>
          </div>

          <Panel className="p-6">
            <p className="font-display text-lg mb-4">Transaction history</p>
            <TransactionList
              transactions={data.transactions}
              emptyTitle="No transfers yet"
              emptyDescription="Link a student and send your first transfer to see it appear here."
            />
          </Panel>
        </ErrorBoundary>
      )}

      <Toast message={toast?.message} tone={toast?.tone} onClose={() => setToast(null)} />
    </DashboardShell>
  );
}
