'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api, apiError } from '@/lib/api.client';
import { Button } from '@/components/ui/Button';
import { useCustomerAuth } from './CustomerAuthProvider';

function safeRedirect(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/[\r\n]/.test(value) ? value : '/account';
}

export function CustomerAuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const { refreshCustomer } = useCustomerAuth();
  const redirect = safeRedirect(params.get('redirect'));
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      if (mode === 'register') {
        await api.post('/auth/customer/register', { ...payload, redirect });
        await refreshCustomer();
        router.replace(redirect); router.refresh();
      } else {
        await api.post('/auth/customer/login', payload);
        await refreshCustomer();
        router.replace(redirect); router.refresh();
      }
    } catch (err) { setError(apiError(err).message); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
      {mode === 'register' && <label className="block text-sm font-medium text-ink">Full name<input name="name" required minLength={2} maxLength={100} autoComplete="name" className="field mt-2" /></label>}
      <label className="block text-sm font-medium text-ink">Email<input name="email" required type="email" maxLength={254} autoComplete="email" className="field mt-2" /></label>
      {mode === 'register' && <label className="block text-sm font-medium text-ink">Phone <span className="font-normal text-ink-muted">(optional)</span><input name="phone" type="tel" autoComplete="tel" className="field mt-2" /></label>}
      <label className="block text-sm font-medium text-ink">Password<input name="password" required type="password" minLength={mode === 'register' ? 10 : 1} maxLength={128} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} className="field mt-2" />{mode === 'register' && <span className="mt-1 block text-xs text-ink-muted">At least 10 characters, including upper and lower case letters and a number.</span>}</label>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl bg-primary-50 p-3 text-sm text-primary-900">{notice}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}</Button>
      {mode === 'login' && <p className="text-center text-sm"><Link href="/forgot-password" className="font-medium text-primary hover:underline">Forgot your password?</Link></p>}
      <p className="text-center text-sm text-ink-muted">{mode === 'register' ? 'Already have an account?' : 'New to FYNE SURFACES?'}{' '}
        <Link className="font-semibold text-primary hover:underline" href={`/${mode === 'register' ? 'login' : 'register'}?redirect=${encodeURIComponent(redirect)}`}>{mode === 'register' ? 'Sign in' : 'Create an account'}</Link>
      </p>
    </form>
  );
}
