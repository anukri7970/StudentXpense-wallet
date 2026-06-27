'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signTransaction } from '@stellar/freighter-api';
import posthog from 'posthog-js';
import api, { getErrorMessage } from '../lib/api';
import Panel from './ui/Panel';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export default function ReleaseFundsForm({ linkedParents, onSuccess }) {
  const [submitError, setSubmitError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setSubmitError('');
    try {
      const { data: buildData } = await api.post('/transactions/release/build', {
        parentId: values.parentId,
        amount: Number(values.amount),
      });

      let signedXdr;
      try {
        const result = await signTransaction(buildData.xdr, {
          networkPassphrase: TESTNET_PASSPHRASE,
        });
        signedXdr = (typeof result === 'string') ? result : result?.signedTxXdr;
        if (!signedXdr) throw new Error('No signed XDR returned. Please ensure Freighter is set to Testnet.');
      } catch (signErr) {
        setSubmitError(signErr.message || 'Transaction signing was cancelled or failed.');
        return;
      }

      const { data } = await api.post('/transactions/release/submit', {
        signedXdr,
        parentId: values.parentId,
        amount: Number(values.amount),
      });

      posthog.capture('funds_released', { amount: Number(values.amount) });
      reset();
      onSuccess(data);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  if (!linkedParents || linkedParents.length === 0) {
    return (
      <Panel className="p-6">
        <p className="font-display text-lg mb-1">Release Escrow Funds</p>
        <p className="text-sm text-slate-muted">
          You have no linked parents. Once a parent links your account, you can release funds here.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="p-6">
      <p className="font-display text-lg mb-4">Release Escrow Funds</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Select
          label="Parent"
          error={errors.parentId?.message}
          {...register('parentId', { required: 'Select a parent.' })}
        >
          <option value="">Select a parent</option>
          {linkedParents.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </Select>
        <Input
          label="Amount (XLM)"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="20"
          error={errors.amount?.message}
          {...register('amount', { required: 'Enter an amount.', min: 0.01 })}
        />
        {submitError && (
          <p role="alert" className="text-sm text-coral">
            {submitError}
          </p>
        )}
        <Button type="submit" variant="secondary" loading={isSubmitting}>
          Release from Soroban
        </Button>
      </form>
    </Panel>
  );
}
