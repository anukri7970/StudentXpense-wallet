'use client';

import { useState } from 'react';
import posthog from 'posthog-js';
import api, { getErrorMessage } from '../lib/api';
import Panel from './ui/Panel';
import Button from './ui/Button';
import Badge from './ui/Badge';

const riskTone = { low: 'mint', medium: 'gold', high: 'coral' };

export default function AiAdvisorPanel({ hasExpenses }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/ai/analyze');
      setReport(data);
      posthog.capture('ai_analysis_run', { riskLevel: data.riskLevel });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel className="p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-display text-lg">AI budget advisor</p>
        {report?.riskLevel && <Badge tone={riskTone[report.riskLevel] || 'neutral'}>{report.riskLevel} risk</Badge>}
      </div>

      {!hasExpenses && (
        <p className="text-sm text-slate-muted">Log at least one expense to get personalized guidance.</p>
      )}

      {hasExpenses && !report && (
        <div>
          <p className="text-sm text-slate-muted mb-4">
            Get a read on your spending pattern, generated from your actual logged expenses.
          </p>
          <Button onClick={runAnalysis} loading={loading} variant="secondary">
            Analyze my budget
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-coral mt-3">{error}</p>}

      {report && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-parchment leading-relaxed">{report.summary}</p>
          {report.recommendations?.length > 0 && (
            <ul className="flex flex-col gap-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-slate-muted flex gap-2">
                  <span className="text-signal-gold mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
          <Button onClick={runAnalysis} loading={loading} variant="ghost" size="sm" className="self-start">
            Re-analyze
          </Button>
        </div>
      )}
    </Panel>
  );
}
