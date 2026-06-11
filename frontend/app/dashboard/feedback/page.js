'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api, { getErrorMessage } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';
import DashboardShell from '../../components/DashboardShell';
import Panel from '../../components/ui/Panel';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ratingOptions = [1, 2, 3, 4, 5];

export default function FeedbackPage() {
  const { user, loading } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { onboardingEaseRating: '', uiRating: '', wouldUseAgain: '' } });

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      await api.post('/feedback', {
        onboardingEaseRating: Number(values.onboardingEaseRating),
        uiRating: Number(values.uiRating),
        wouldUseAgain: values.wouldUseAgain === 'true',
        favoriteFeature: values.favoriteFeature || undefined,
        comments: values.comments || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  if (loading) return null;

  return (
    <DashboardShell>
      <h1 className="font-display text-3xl mb-1">Quick feedback</h1>
      <p className="text-slate-muted mb-8">
        Two minutes, helps us improve the product. Responses feed the summary in our submission.
      </p>

      <Panel className="p-8 max-w-xl">
        {submitted ? (
          <div className="text-center py-6">
            <p className="font-display text-xl text-mint mb-2">Thanks — recorded.</p>
            <p className="text-sm text-slate-muted">You can close this page now.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <fieldset>
              <legend className="text-sm font-medium text-slate-muted mb-2">
                Was onboarding easy? (1 = difficult, 5 = effortless)
              </legend>
              <div className="flex gap-2">
                {ratingOptions.map((n) => (
                  <label
                    key={n}
                    className={`flex-1 text-center py-2 rounded-md border cursor-pointer transition-colors ${
                      watch('onboardingEaseRating') === String(n)
                        ? 'border-signal-gold bg-signal-gold/10 text-signal-gold'
                        : 'border-ink-border text-slate-muted hover:border-slate-faint'
                    }`}
                  >
                    <input
                      type="radio"
                      value={n}
                      className="sr-only"
                      {...register('onboardingEaseRating', { required: true })}
                    />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-slate-muted mb-2">
                Rate the interface (1 = poor, 5 = excellent)
              </legend>
              <div className="flex gap-2">
                {ratingOptions.map((n) => (
                  <label
                    key={n}
                    className={`flex-1 text-center py-2 rounded-md border cursor-pointer transition-colors ${
                      watch('uiRating') === String(n)
                        ? 'border-signal-gold bg-signal-gold/10 text-signal-gold'
                        : 'border-ink-border text-slate-muted hover:border-slate-faint'
                    }`}
                  >
                    <input type="radio" value={n} className="sr-only" {...register('uiRating', { required: true })} />
                    {n}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium text-slate-muted mb-2">Would you use this again?</legend>
              <div className="flex gap-2">
                {[
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex-1 text-center py-2 rounded-md border cursor-pointer transition-colors ${
                      watch('wouldUseAgain') === opt.value
                        ? 'border-signal-gold bg-signal-gold/10 text-signal-gold'
                        : 'border-ink-border text-slate-muted hover:border-slate-faint'
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      {...register('wouldUseAgain', { required: true })}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <Input label="Favorite feature (optional)" placeholder="Expense tracking" {...register('favoriteFeature')} />
            <Input label="Anything else? (optional)" placeholder="Comments" {...register('comments')} />

            {(errors.onboardingEaseRating || errors.uiRating || errors.wouldUseAgain) && (
              <p role="alert" className="text-sm text-coral">
                Please answer all required questions above.
              </p>
            )}
            {submitError && (
              <p role="alert" className="text-sm text-coral">
                {submitError}
              </p>
            )}

            <Button type="submit" loading={isSubmitting}>
              Submit feedback
            </Button>
          </form>
        )}
      </Panel>
    </DashboardShell>
  );
}
