'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, apiError } from '@/lib/api.client';
import { Button } from '@/components/ui/Button';

export function PasswordRecoveryForm({ mode }: { mode: 'forgot' | 'reset' }) {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); setError(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      if (mode === 'forgot') {
        await api.post('/auth/customer/forgot-password', values);
        setMessage('If an account exists and email delivery is configured, a reset link will be sent. If you can sign in, you can change your password from Account settings.');
      } else {
        const token = params.get('token');
        if (!token) throw new Error('The reset link is missing its token. Request a new link.');
        await api.post('/auth/customer/reset-password', { ...values, token });
        setMessage('Password updated. Taking you to sign in…');
        window.setTimeout(() => router.replace('/login'), 800);
      }
    } catch (err) { setError(err instanceof Error && err.message.startsWith('The reset link') ? err.message : apiError(err).message); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
    {mode === 'forgot' ? <label className="block text-sm font-medium">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className="field mt-2" /></label> : <label className="block text-sm font-medium">New password<input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="field mt-2" /><span className="mt-1 block text-xs text-ink-muted">At least 10 characters, including upper and lower case letters and a number.</span></label>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-primary-50 p-3 text-sm text-primary-900">{message}</p>}
    <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'forgot' ? 'Send reset link' : 'Update password'}</Button>
  </form>;
}
