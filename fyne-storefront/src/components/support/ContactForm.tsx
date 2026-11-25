'use client';

import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { api, apiError } from '@/lib/api.client';
import { Button } from '@/components/ui/Button';

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());
    try {
      await api.post('/contact', payload);
      formElement.reset();
      setNotice({ error: false, text: 'Thanks for contacting us. Our team has received your message.' });
    } catch (error) { setNotice({ error: true, text: apiError(error).message }); }
    finally { setBusy(false); }
  }

  const field = 'field mt-2';
  return <form onSubmit={submit} className="space-y-5 rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block text-sm font-medium text-ink-soft">Your name<input name="name" required minLength={2} maxLength={100} autoComplete="name" className={field} /></label>
      <label className="block text-sm font-medium text-ink-soft">Subject <span className="font-normal text-ink-muted">(optional)</span><input name="subject" maxLength={160} className={field} /></label>
      <label className="block text-sm font-medium text-ink-soft">Email <span className="font-normal text-ink-muted">(or phone)</span><input name="email" type="email" maxLength={254} autoComplete="email" className={field} /></label>
      <label className="block text-sm font-medium text-ink-soft">Phone <span className="font-normal text-ink-muted">(or email)</span><input name="phone" type="tel" maxLength={20} autoComplete="tel" className={field} /></label>
    </div>
    <label className="block text-sm font-medium text-ink-soft">How can we help?<textarea name="message" required minLength={10} maxLength={4000} rows={6} className="field mt-2 h-auto py-3" placeholder="Tell us about your question, order or project…" /></label>
    <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {notice && <p role={notice.error ? 'alert' : 'status'} className={`rounded-xl p-4 text-sm ${notice.error ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-900'}`}>{notice.text}</p>}
    <Button type="submit" disabled={busy} loading={busy}><Send className="h-4 w-4" /> Send message</Button>
  </form>;
}
