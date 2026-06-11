'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api, { getErrorMessage } from '../lib/api';
import Panel from './ui/Panel';
import Input from './ui/Input';
import Button from './ui/Button';

export default function LinkStudentForm({ onSuccess }) {
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setSubmitError('');
    setSuccess('');
    try {
      const { data } = await api.post('/users/link-student', { studentEmail: values.studentEmail });
      setSuccess(data.message);
      reset();
      onSuccess(data.student);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <Panel className="p-6">
      <p className="font-display text-lg mb-1">Link a student</p>
      <p className="text-sm text-slate-muted mb-4">
        Enter the email your student used to sign up.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Input
          label="Student email"
          type="email"
          placeholder="student@example.com"
          error={errors.studentEmail?.message}
          {...register('studentEmail', { required: 'Student email is required.' })}
        />
        {submitError && (
          <p role="alert" className="text-sm text-coral">
            {submitError}
          </p>
        )}
        {success && <p className="text-sm text-mint">{success}</p>}
        <Button type="submit" variant="secondary" loading={isSubmitting}>
          Link student
        </Button>
      </form>
    </Panel>
  );
}
