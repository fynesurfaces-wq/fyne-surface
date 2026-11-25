'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, apiError } from '@/lib/api.client';
import { useCustomerAuth } from './CustomerAuthProvider';

export function VerifyEmail() {
  const params = useSearchParams(); const router = useRouter();
  const { refreshCustomer } = useCustomerAuth();
  const verificationStarted = useRef(false);
  const [message, setMessage] = useState('Verifying your email…');
  useEffect(() => {
    if (verificationStarted.current) return;
    verificationStarted.current = true;
    const token = params.get('token');
    if (!token) { setMessage('This verification link is missing its token.'); return; }
    api.post('/auth/customer/verify-email', { token })
      .then(async () => { await refreshCustomer(); setMessage('Email verified. Taking you back…'); const target=params.get('redirect'); const redirect=target?.startsWith('/')&&!target.startsWith('//')&&!target.includes('\\')&&!/[\r\n]/.test(target)?target:'/account'; window.setTimeout(() => { router.replace(redirect); router.refresh(); }, 700); })
      .catch((error) => setMessage(apiError(error).message));
  }, [params, refreshCustomer, router]);
  return <p role="status" className="rounded-2xl border border-line bg-white p-6 text-ink-soft">{message}</p>;
}
