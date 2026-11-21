'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, Lock, Mail, Leaf } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { getApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { fallbackRoute } from '@/lib/access';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Form';
import { Logo } from '@/components/layout/Logo';

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  ACCOUNT_DISABLED: 'This account has been disabled. Contact your administrator.',
  TOO_MANY_REQUESTS: 'Too many login attempts. Please wait 15 minutes and try again.',
  NETWORK: 'Cannot reach the server. Please check your connection.',
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, status } = useAuth();
  const [error, setError] = useState<string | null>(params.get('expired') ? 'Your session expired. Please sign in again.' : null);
  const [show, setShow] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const goNext = () => {
    const { user, permissions } = useAuthStore.getState();
    const next = params.get('next');
    // Only allow internal redirects (prevents open-redirect via ?next=https://evil)
    const safe = next && next.startsWith('/dashboard') && !next.startsWith('//') ? next : fallbackRoute(user?.role, permissions);
    router.replace(safe);
  };

  // Already signed in (e.g. silent refresh succeeded) → skip the form.
  useEffect(() => {
    if (status === 'authenticated') goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      goNext();
    } catch (err) {
      const e = getApiError(err);
      setError(MESSAGES[e.code] || e.message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Soft brand backdrop */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-secondary-100/60 blur-3xl" />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="scale-125" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-secondary">Natural spaces. Better living.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-pop">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-ink">Sign in to Admin</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage your products, collections and orders.</p>
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-danger-50 px-3.5 py-3 text-sm text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Field label="Email" htmlFor="email" error={errors.email?.message}>
              <Input id="email" type="email" autoComplete="username" placeholder="you@fynesurfaces.com" leftIcon={<Mail className="h-4 w-4" />} invalid={!!errors.email} className="h-11" {...register('email')} />
            </Field>
            <Field label="Password" htmlFor="password" error={errors.password?.message}>
              <div className="relative">
                <Input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••••" leftIcon={<Lock className="h-4 w-4" />} invalid={!!errors.password} className="h-11 pr-10" {...register('password')} />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Leaf className="h-3.5 w-3.5 text-primary" /> FYNE SURFACES · Premium Vertical Garden
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
