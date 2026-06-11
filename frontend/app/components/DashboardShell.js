'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import Badge from './ui/Badge';
import Button from './ui/Button';

const roleTone = { parent: 'gold', student: 'mint', university: 'neutral' };

function truncateKey(key) {
  if (!key) return '';
  return `${key.slice(0, 6)}…${key.slice(-6)}`;
}

export default function DashboardShell({ children }) {
  const { user, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    if (!user?.stellarPublicKey) return;
    await navigator.clipboard.writeText(user.stellarPublicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-ink-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-display text-lg">
            Student Expense Wallet
          </Link>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <Badge tone={roleTone[user.role] || 'neutral'}>{user.role}</Badge>
                <Link
                  href="/dashboard/feedback"
                  className="hidden sm:inline text-sm text-slate-muted hover:text-parchment transition-colors"
                >
                  Feedback
                </Link>
                <button
                  onClick={copyAddress}
                  title="Copy Stellar public key"
                  className="hidden sm:inline tabular text-xs text-slate-muted hover:text-parchment border border-ink-border rounded-md px-2.5 py-1.5 transition-colors"
                >
                  {copied ? 'Copied' : truncateKey(user.stellarPublicKey)}
                </button>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
