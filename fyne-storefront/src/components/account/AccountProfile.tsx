'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound, LogOut, MapPin, PackageCheck, Pencil, UserRound } from 'lucide-react';
import { api, apiError } from '@/lib/api.client';
import { Button } from '@/components/ui/Button';
import { useCustomerAuth } from '@/components/auth/CustomerAuthProvider';

type Address = { fullName?: string; phone?: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country?: string };
type Customer = { id: string; name: string; email: string; phone: string; addresses: Address[] };

export function AccountProfile() {
  const router = useRouter();
  const { logout, refreshCustomer } = useCustomerAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState('Loading your profile…');
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  useEffect(() => {
    let active = true;
    api.get('/auth/customer/profile')
      .then(({ data }) => { if (active) { setCustomer(data.data.customer); setMessage(''); } })
      .catch(() => { if (active) router.replace('/login?redirect=%2Faccount'); });
    return () => { active = false; };
  }, [router]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;
    setBusy(true); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await api.patch('/auth/customer/profile', { name: form.get('name'), phone: form.get('phone') });
      setCustomer(response.data.data.customer);
      await refreshCustomer();
      setEditing(false);
      setMessage('Your profile details are saved.');
    } catch (error) { setMessage(apiError(error).message); }
    finally { setBusy(false); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordBusy(true); setPasswordMessage('');
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    if (values.password !== values.confirmPassword) { setPasswordMessage('The new passwords do not match.'); setPasswordBusy(false); return; }
    try {
      await api.post('/auth/customer/change-password', { currentPassword: values.currentPassword, password: values.password });
      form.reset();
      await logout();
      router.replace('/login'); router.refresh();
    } catch (error) { setPasswordMessage(apiError(error).message); }
    finally { setPasswordBusy(false); }
  }

  async function signOut() {
    setBusy(true); setMessage('');
    try { await logout(); router.replace('/'); router.refresh(); }
    catch (error) { setMessage(apiError(error).message); }
    finally { setBusy(false); }
  }

  if (!customer) return <p role="status" className="rounded-xl border border-line bg-white p-5 text-sm text-ink-muted">{message}</p>;

  return (
    <div className="space-y-6">
      <section aria-labelledby="account-profile-heading" className="overflow-hidden rounded-3xl border border-line bg-white shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-gradient-to-r from-primary-50 to-white p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white"><UserRound className="h-6 w-6" /></span>
            <div><p className="text-eyebrow uppercase text-accent-700">Customer profile</p><h2 id="account-profile-heading" className="mt-1 font-serif text-2xl text-primary-950">{customer.name}</h2></div>
          </div>
          <Button type="button" variant="outline" onClick={() => { setEditing((value) => !value); setMessage(''); }}><Pencil className="h-4 w-4" />{editing ? 'Cancel editing' : 'Edit profile'}</Button>
        </div>

        {editing ? (
          <form key={`${customer.id}-${customer.name}-${customer.phone}`} onSubmit={save} className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
            <label className="block text-sm font-medium text-ink">Full name<input name="name" defaultValue={customer.name} required minLength={2} maxLength={100} autoComplete="name" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink">Email address<input value={customer.email} readOnly className="field mt-2 bg-canvas" /><span className="mt-1 block text-xs text-ink-muted">Contact support if you need to change your email address.</span></label>
            <label className="block text-sm font-medium text-ink sm:col-span-2">Phone number<input name="phone" defaultValue={customer.phone} maxLength={20} autoComplete="tel" className="field mt-2" /></label>
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button><Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
          </form>
        ) : (
          <dl className="grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Full name</dt><dd className="mt-1 font-medium text-ink">{customer.name}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Email address</dt><dd className="mt-1 break-all font-medium text-ink">{customer.email}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Phone number</dt><dd className="mt-1 font-medium text-ink">{customer.phone || 'Not added yet'}</dd></div>
            <div><dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Account</dt><dd className="mt-1 font-medium text-ink">Active</dd></div>
          </dl>
        )}
        {message && <p role="status" className="border-t border-line px-6 py-3 text-sm text-primary sm:px-8">{message}</p>}
      </section>

      <section aria-labelledby="saved-addresses-heading" className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
        <div className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><h2 id="saved-addresses-heading" className="font-serif text-xl text-ink">Saved delivery addresses</h2>
          {customer.addresses?.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">{customer.addresses.map((address, index) => <li key={`${address.line1}-${address.postalCode}-${index}`} className="rounded-2xl bg-canvas p-4 text-sm leading-6 text-ink-soft"><p className="font-semibold text-ink">{address.fullName || customer.name}</p>{address.phone && <p>{address.phone}</p>}<p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p><p>{address.city}, {address.state} {address.postalCode}</p><p>{address.country || 'IN'}</p></li>)}</ul> : <p className="mt-2 text-sm leading-6 text-ink-muted">No saved addresses yet. Save a delivery address during checkout and it will appear here.</p>}
        </div></div>
      </section>

      <section aria-label="Account tools" className="grid gap-3 sm:grid-cols-3">
        <Link href="/account/orders" className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 transition hover:border-primary-200 hover:bg-primary-50/50"><PackageCheck className="h-5 w-5 text-primary" /><span className="min-w-0 flex-1"><span className="block font-semibold text-ink">Orders & tracking</span><span className="mt-1 block text-xs text-ink-muted">View purchases and deliveries</span></span><ArrowRight className="h-4 w-4 text-ink-muted transition group-hover:translate-x-1" /></Link>
        <button type="button" onClick={() => { setPasswordOpen((value) => !value); setPasswordMessage(''); }} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 text-left transition hover:border-primary-200 hover:bg-primary-50/50"><KeyRound className="h-5 w-5 text-primary" /><span className="min-w-0 flex-1"><span className="block font-semibold text-ink">Password & security</span><span className="mt-1 block text-xs text-ink-muted">{passwordOpen ? 'Hide password form' : 'Change your password'}</span></span><ArrowRight className="h-4 w-4 text-ink-muted transition group-hover:translate-x-1" /></button>
        <button type="button" onClick={signOut} disabled={busy} className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 text-left transition hover:border-red-200 hover:bg-red-50 disabled:opacity-60"><LogOut className="h-5 w-5 text-primary" /><span className="min-w-0 flex-1"><span className="block font-semibold text-ink">Sign out</span><span className="mt-1 block text-xs text-ink-muted">End this customer session</span></span><ArrowRight className="h-4 w-4 text-ink-muted transition group-hover:translate-x-1" /></button>
      </section>

      {passwordOpen && <section aria-labelledby="account-password-heading" className="rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8">
        <h2 id="account-password-heading" className="font-serif text-xl text-ink">Change password</h2>
        <form onSubmit={changePassword} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium sm:col-span-2">Current password<input name="currentPassword" type="password" required maxLength={128} autoComplete="current-password" className="field mt-2" /></label>
          <label className="block text-sm font-medium">New password<input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="field mt-2" /><span className="mt-1 block text-xs text-ink-muted">At least 10 characters, including upper and lower case letters and a number.</span></label>
          <label className="block text-sm font-medium">Confirm new password<input name="confirmPassword" type="password" required minLength={10} maxLength={128} autoComplete="new-password" className="field mt-2" /></label>
          {passwordMessage && <p role="status" className="text-sm text-primary sm:col-span-2">{passwordMessage}</p>}
          <div className="sm:col-span-2"><Button type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Change password'}</Button></div>
        </form>
      </section>}
    </div>
  );
}
