'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, KeyRound, LogOut, MapPin, PackageCheck, Pencil, UserRound } from 'lucide-react';
import { api, apiError } from '@/lib/api.client';
import { Button } from '@/components/ui/Button';
import { useCustomerAuth } from '@/components/auth/CustomerAuthProvider';

type Address = { fullName?: string; phone?: string; line1: string; line2?: string; landmark?: string; city: string; state: string; postalCode: string; country?: string; addressType?: 'Home' | 'Work' };
type Customer = { id: string; name: string; email: string; phone: string; addresses: Address[] };

export function AccountProfile() {
  const router = useRouter();
  const { logout, refreshCustomer } = useCustomerAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [message, setMessage] = useState('Loading your profile…');
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressBusy, setAddressBusy] = useState(false);
  const [addressMessage, setAddressMessage] = useState('');
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

  async function saveAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;
    setAddressBusy(true); setAddressMessage('');
    const form = new FormData(event.currentTarget);
    const address: Address = {
      fullName: String(form.get('fullName') || '').trim(),
      phone: String(form.get('phone') || '').replace(/\D/g, ''),
      line1: String(form.get('line1') || '').trim(),
      line2: String(form.get('line2') || '').trim() || undefined,
      landmark: String(form.get('landmark') || '').trim() || undefined,
      city: String(form.get('city') || '').trim(),
      state: String(form.get('state') || '').trim(),
      postalCode: String(form.get('postalCode') || '').trim(),
      country: 'IN',
      addressType: form.get('addressType') === 'Work' ? 'Work' : 'Home',
    };
    try {
      const response = await api.patch('/auth/customer/profile', {
        address,
        ...(editingAddress && { replaceAddress: { line1: editingAddress.line1, postalCode: editingAddress.postalCode } }),
      });
      setCustomer(response.data.data.customer);
      setEditingAddress(null); setAddressFormOpen(false); setAddressMessage('Address saved to your profile.');
    } catch (error) { setAddressMessage(apiError(error).message); }
    finally { setAddressBusy(false); }
  }

  async function deleteAddress(address: Address) {
    if (!customer || !window.confirm('Remove this saved delivery address?')) return;
    setAddressBusy(true); setAddressMessage('');
    try {
      const response = await api.patch('/auth/customer/profile', { removeAddress: { line1: address.line1, postalCode: address.postalCode } });
      setCustomer(response.data.data.customer); setAddressMessage('Address removed from your profile.');
      if (editingAddress && editingAddress.line1 === address.line1 && editingAddress.postalCode === address.postalCode) { setEditingAddress(null); setAddressFormOpen(false); }
    } catch (error) { setAddressMessage(apiError(error).message); }
    finally { setAddressBusy(false); }
  }

  function startAddressEdit(address: Address) {
    setEditingAddress(address); setAddressFormOpen(true); setAddressMessage('');
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" /><div><h2 id="saved-addresses-heading" className="font-serif text-xl text-ink">Saved delivery addresses</h2><p className="mt-1 text-sm text-ink-muted">Add and manage addresses for a faster checkout.</p></div></div>
          <Button type="button" variant="outline" onClick={() => { if (addressFormOpen && !editingAddress) setAddressFormOpen(false); else { setEditingAddress(null); setAddressFormOpen(true); } setAddressMessage(''); }}>{addressFormOpen && !editingAddress ? 'Close form' : 'Add address'}</Button>
        </div>
        {addressFormOpen && <form key={editingAddress ? `${editingAddress.line1}-${editingAddress.postalCode}` : 'new-address'} onSubmit={saveAddress} className="mt-6 rounded-2xl border border-line p-4 sm:p-5">
          <h3 className="font-semibold text-ink">{editingAddress ? 'Edit address' : 'Add a delivery address'}</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink-soft">Full name<input name="fullName" defaultValue={editingAddress?.fullName || customer.name} required minLength={2} maxLength={100} autoComplete="name" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft">Phone number<input name="phone" defaultValue={(editingAddress?.phone || customer.phone || '').replace(/\D/g, '').slice(-10)} required pattern="[0-9]{10}" inputMode="numeric" maxLength={10} autoComplete="tel" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft sm:col-span-2">Address line 1<input name="line1" defaultValue={editingAddress?.line1 || ''} required minLength={3} maxLength={200} autoComplete="address-line1" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft">Address line 2 (optional)<input name="line2" defaultValue={editingAddress?.line2 || ''} maxLength={200} autoComplete="address-line2" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft">Landmark (optional)<input name="landmark" defaultValue={editingAddress?.landmark || ''} maxLength={120} className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft">City<input name="city" defaultValue={editingAddress?.city || ''} required minLength={2} maxLength={80} autoComplete="address-level2" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft">State<input name="state" defaultValue={editingAddress?.state || ''} required minLength={2} maxLength={80} autoComplete="address-level1" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft">Pincode<input name="postalCode" defaultValue={editingAddress?.postalCode || ''} required pattern="[0-9]{6}" inputMode="numeric" maxLength={6} autoComplete="postal-code" className="field mt-2" /></label>
            <label className="block text-sm font-medium text-ink-soft">Address type<select name="addressType" defaultValue={editingAddress?.addressType || 'Home'} className="field mt-2"><option value="Home">Home</option><option value="Work">Work</option></select></label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3"><Button type="submit" disabled={addressBusy}>{addressBusy ? 'Saving…' : editingAddress ? 'Save address' : 'Add address'}</Button><Button type="button" variant="ghost" onClick={() => { setEditingAddress(null); setAddressFormOpen(false); }}>Cancel</Button></div>
        </form>}
        {customer.addresses?.length ? <ul className="mt-5 grid gap-3 sm:grid-cols-2">{customer.addresses.map((address, index) => <li key={`${address.line1}-${address.postalCode}-${index}`} className="rounded-2xl bg-canvas p-4 text-sm leading-6 text-ink-soft"><p className="font-semibold text-ink">{address.fullName || customer.name}{address.addressType ? ` · ${address.addressType}` : ''}</p>{address.phone && <p>{address.phone}</p>}<p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>{address.landmark && <p>Near {address.landmark}</p>}<p>{address.city}, {address.state} {address.postalCode}</p><p>{address.country || 'IN'}</p><div className="mt-3 flex gap-4 border-t border-line pt-3"><button type="button" disabled={addressBusy} onClick={() => startAddressEdit(address)} className="text-xs font-semibold text-primary hover:underline">Edit</button><button type="button" disabled={addressBusy} onClick={() => void deleteAddress(address)} className="text-xs font-semibold text-red-700 hover:underline">Remove</button></div></li>)}</ul> : <p className="mt-4 text-sm leading-6 text-ink-muted">No saved addresses yet. Add one here or enter it during checkout.</p>}
        {addressMessage && <p role="status" className="mt-4 text-sm text-primary">{addressMessage}</p>}
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
