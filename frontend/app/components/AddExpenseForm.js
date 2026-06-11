'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import posthog from 'posthog-js';
import api, { getErrorMessage } from '../lib/api';
import Panel from './ui/Panel';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';

const categories = [
  { value: 'food', label: 'Food' },
  { value: 'books', label: 'Books' },
  { value: 'transport', label: 'Transport' },
  { value: 'rent', label: 'Rent' },
  { value: 'fees', label: 'Fees' },
  { value: 'other', label: 'Other' },
];

export default function AddExpenseForm({ onSuccess }) {
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
      const { data } = await api.post('/expenses', {
        category: values.category,
        amount: Number(values.amount),
        note: values.note || undefined,
      });
      posthog.capture('expense_added', { category: values.category, amount: Number(values.amount) });
      reset();
      onSuccess(data);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <Panel className="p-6">
      <p className="font-display text-lg mb-4">Log an expense</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            error={errors.category?.message}
            {...register('category', { required: 'Pick a category.' })}
          >
            <option value="">Choose</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
          <Input
            label="Amount (XLM)"
            type="number"
            step="0.01"
            min="0"
            placeholder="50"
            error={errors.amount?.message}
            {...register('amount', { required: 'Enter an amount.', min: 0 })}
          />
        </div>
        <Input label="Note (optional)" placeholder="Canteen lunch" {...register('note')} />
        {submitError && (
          <p role="alert" className="text-sm text-coral">
            {submitError}
          </p>
        )}
        <Button type="submit" variant="secondary" loading={isSubmitting}>
          Add expense
        </Button>
      </form>
    </Panel>
  );
}
