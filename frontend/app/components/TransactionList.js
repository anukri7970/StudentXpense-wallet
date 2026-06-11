import { EmptyState } from './ui/Feedback';

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

const typeLabels = {
  parent_deposit: 'Sent to student',
  student_release: 'Released to wallet',
  tuition_payment: 'Tuition payment',
};

export default function TransactionList({ transactions, emptyTitle, emptyDescription }) {
  if (!transactions || transactions.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-faint border-b border-ink-border">
            <th className="py-2.5 pr-4 font-medium">Type</th>
            <th className="py-2.5 pr-4 font-medium">Amount</th>
            <th className="py-2.5 pr-4 font-medium">Date</th>
            <th className="py-2.5 pr-4 font-medium">Tx hash</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t._id} className="border-b border-ink-border/60 last:border-0">
              <td className="py-3 pr-4 text-parchment">{typeLabels[t.type] || t.type}</td>
              <td className="py-3 pr-4 tabular text-parchment">
                {t.amount.toLocaleString()} {t.assetCode}
              </td>
              <td className="py-3 pr-4 text-slate-muted tabular">{formatDate(t.createdAt)}</td>
              <td className="py-3 pr-4">
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${t.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="tabular text-signal-gold hover:underline"
                >
                  {truncateHash(t.txHash)}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
