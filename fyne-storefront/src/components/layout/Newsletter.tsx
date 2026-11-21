'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { api, apiError } from '@/lib/api.client';

/**
 * Newsletter signup → stored as a Lead in the backend (Admin → Leads),
 * source "other", so marketing can export subscribers.
 */
export function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setState('error');
      setMessage('Please enter a valid email address.');
      return;
    }
    setState('loading');
    try {
      await api.post('/store/leads', { name: 'Newsletter subscriber', email, source: 'other', message: 'Newsletter signup (storefront footer)' });
      setState('done');
      setMessage('You’re on the list. Welcome to FYNE.');
      setEmail('');
    } catch (err) {
      setState('error');
      setMessage(apiError(err).message);
    }
  };

  return (
    <form onSubmit={submit} className="w-full lg:justify-self-end" noValidate>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <div className="flex w-full max-w-lg items-center rounded-full border border-white/20 bg-white/5 p-1.5 transition focus-within:border-white/60">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state !== 'loading') setState('idle'); }}
          placeholder="Your email address"
          className="h-11 flex-1 bg-transparent px-5 text-[15px] text-white placeholder:text-white/40 focus:outline-none"
          aria-invalid={state === 'error'}
          aria-describedby="newsletter-msg"
        />
        <button type="submit" disabled={state === 'loading'} className="flex h-11 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent-600 disabled:opacity-70">
          {state === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : state === 'done' ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
          <span className="hidden sm:inline">Subscribe</span>
        </button>
      </div>
      <p id="newsletter-msg" role="status" className={`mt-3 min-h-[20px] px-5 text-sm ${state === 'error' ? 'text-accent-300' : 'text-white/60'}`}>
        {message || 'No spam. Unsubscribe anytime.'}
      </p>
    </form>
  );
}
