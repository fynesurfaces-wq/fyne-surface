'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, Banknote, Check, Loader2, Lock, MapPin, PackageCheck, Truck } from 'lucide-react';
import { api, apiError } from '@/lib/api.client';
import { cn, formatINR } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PlantImage } from '@/components/ui/PlantImage';
import { PageBanner } from '@/components/layout/PageBanner';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phoneNumber: z.string().trim().regex(/^\d{10}$/, 'Enter a 10-digit phone number'),
  addressLine1: z.string().trim().min(3, 'Enter your address').max(200),
  addressLine2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(120).optional(),
  city: z.string().trim().min(2, 'Enter your city').max(80),
  state: z.string().trim().min(2, 'Enter your state').max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit pincode'),
  addressType: z.enum(['Home', 'Work']),
  notes: z.string().trim().max(500).optional(),
  saveAddress: z.boolean(),
}).strict();
type Values = z.infer<typeof schema>;
type Quote = { items: { product: string; name: string; sku: string; image?: string; price: number; qty: number; lineTotal: number }[]; subtotal: number; discount?: { code?: string; amount: number }; shippingFee: number; tax: { amount: number; rate: number; included: boolean }; totalAmount: number; currency: string };
type Address = { fullName?: string; phone?: string; line1: string; line2?: string; landmark?: string; city: string; state: string; postalCode: string; country?: string; addressType?: 'Home' | 'Work' };
type ShippingAddress = { fullName: string; phoneNumber: string; addressLine1: string; addressLine2?: string; landmark?: string; city: string; state: string; pincode: string; addressType: 'Home' | 'Work' };
const fieldsByStep: Record<number, (keyof Values)[]> = {
  1: ['fullName', 'email', 'phoneNumber', 'addressLine1', 'addressLine2', 'landmark', 'city', 'state', 'pincode', 'addressType'],
  2: [],
  3: [],
};

export default function CheckoutForm() {
  const router = useRouter();
  const { items, hydrated, clear } = useCart();
  const [step, setStep] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState('');
  const [discountInput, setDiscountInput] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountBusy, setDiscountBusy] = useState(false);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const { register, handleSubmit, setValue, trigger, watch, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', phoneNumber: '', addressLine1: '', addressLine2: '', landmark: '', city: '', state: '', pincode: '', addressType: 'Home', notes: '', saveAddress: false },
  });
  const form = watch();
  const cartPayload = useMemo(() => items.map((item) => ({ product: item.productId, qty: item.qty })), [items]);

  useEffect(() => {
    api.get<{ data: { customer: { name: string; email: string; phone?: string; addresses?: Address[] } } }>('/auth/customer/profile')
      .then(({ data }) => {
        const customer = data.data.customer;
        const profilePhone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
        setValue('fullName', customer.name || ''); setValue('email', customer.email || ''); setValue('phoneNumber', profilePhone);
        setSavedAddresses(customer.addresses || []);
        const saved = customer.addresses?.[0];
        if (saved) {
          setSelectedSavedAddress('0');
          setValue('fullName', saved.fullName || customer.name || '');
          setValue('phoneNumber', String(saved.phone || customer.phone || '').replace(/\D/g, '').slice(-10));
          setValue('addressLine1', saved.line1); setValue('addressLine2', saved.line2 || ''); setValue('landmark', saved.landmark || ''); setValue('city', saved.city);
          setValue('state', saved.state); setValue('pincode', saved.postalCode); setValue('addressType', saved.addressType || 'Home');
        }
      })
      .catch(() => router.replace(`/login?redirect=${encodeURIComponent('/checkout')}`));
  }, [router, setValue]);

  useEffect(() => {
    if (!hydrated) return;
    if (!cartPayload.length) { setQuote(null); setQuoteLoading(false); return; }
    let active = true;
    setQuoteLoading(true); setError('');
    api.post<{ data: Quote }>('/orders/quote', { items: cartPayload, ...(discountCode && { discountCode }) })
      .then(({ data }) => { if (active) setQuote(data.data); })
      .catch((err) => { if (active) { setQuote(null); setError(apiError(err).message); if (discountCode) setDiscountCode(''); } })
      .finally(() => { if (active) setQuoteLoading(false); });
    return () => { active = false; };
  }, [hydrated, cartPayload, discountCode]);

  async function applyDiscount() {
    const next = discountInput.trim().toUpperCase();
    if (!next) return;
    setDiscountBusy(true); setError('');
    try {
      const { data } = await api.post<{ data: Quote }>('/orders/quote', { items: cartPayload, discountCode: next });
      setQuote(data.data); setDiscountCode(next);
    } catch (err) { setError(apiError(err).message); }
    finally { setDiscountBusy(false); }
  }

  async function advance() {
    setError('');
    if (await trigger(fieldsByStep[step])) setStep((current) => Math.min(3, current + 1));
  }

  function chooseSavedAddress(value: string) {
    setSelectedSavedAddress(value);
    const saved = savedAddresses[Number(value)];
    if (!saved || value === '') return;
    setValue('fullName', saved.fullName || ''); setValue('phoneNumber', String(saved.phone || '').replace(/\D/g, '').slice(-10));
    setValue('addressLine1', saved.line1); setValue('addressLine2', saved.line2 || ''); setValue('landmark', saved.landmark || '');
    setValue('city', saved.city); setValue('state', saved.state); setValue('pincode', saved.postalCode); setValue('addressType', saved.addressType || 'Home');
  }

  async function placeOrder(values: Values) {
    if (!quote || quoteLoading) return;
    setPlacing(true); setError('');
    const shippingAddress: ShippingAddress = { fullName: values.fullName, phoneNumber: values.phoneNumber, addressLine1: values.addressLine1, addressLine2: values.addressLine2 || undefined, landmark: values.landmark || undefined, city: values.city, state: values.state, pincode: values.pincode, addressType: values.addressType };
    try {
      if (values.saveAddress) await api.patch('/auth/customer/profile', { address: { fullName: shippingAddress.fullName, phone: shippingAddress.phoneNumber, line1: shippingAddress.addressLine1, line2: shippingAddress.addressLine2, landmark: shippingAddress.landmark, city: shippingAddress.city, state: shippingAddress.state, postalCode: shippingAddress.pincode, country: 'IN', addressType: shippingAddress.addressType } });
      const { data } = await api.post<{ data: { orderId: string; order: { id: string } } }>('/orders', { items: cartPayload, shippingAddress, notes: values.notes || undefined, discountCode: discountCode || undefined });
      clear();
      router.replace(`/order-success/${data.data.orderId}`);
      router.refresh();
    } catch (err) {
      const issue = apiError(err);
      if (['CUSTOMER_AUTH_REQUIRED', 'CUSTOMER_SESSION_EXPIRED', 'CUSTOMER_NOT_VERIFIED'].includes(issue.code)) {
        router.replace(`/login?redirect=${encodeURIComponent('/checkout')}`);
      } else setError(issue.message);
    } finally { setPlacing(false); }
  }

  if (!hydrated) return <><PageBanner eyebrow="Secure checkout" title="Complete your order" /><section className="container min-h-[35vh] py-20" aria-busy="true" /></>;
  if (!items.length) return <><PageBanner eyebrow="Your order" title="Your cart is empty" description="Add products before continuing to checkout." /><section className="container py-20 text-center"><ButtonLink href="/collections">Explore collections</ButtonLink></section></>;

  const inputClass = (key: keyof Values) => cn('field', errors[key] && 'field-invalid');
  const input = (name: keyof Values, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="block text-sm font-medium text-ink-soft">{label}<input {...props} {...register(name)} className={cn(inputClass(name), 'mt-2')} />{errors[name] && <span className="mt-1 block text-xs text-red-600">{errors[name]?.message}</span>}</label>;
  const stepNames = ['Shipping address', 'Delivery method', 'Review order'];

  return <>
    <PageBanner eyebrow="Secure checkout" title="Complete your order" description="Three quick steps, with Cash on Delivery at checkout." />
    <section className="container max-w-6xl pb-24 pt-10 sm:pt-14">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>
      <ol className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Checkout progress">
        {stepNames.map((name, index) => { const number = index + 1; const active = number === step; const complete = number < step; return <li key={name} className={cn('rounded-2xl border p-3 text-center text-xs sm:p-4 sm:text-sm', active ? 'border-primary bg-primary-50 text-primary-900' : 'border-line bg-white text-ink-muted')}><span className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-white font-semibold text-primary">{complete ? <Check className="h-4 w-4" /> : number}</span><span className="font-medium">{name}</span></li>; })}
      </ol>
      <h2 className="mt-9 font-serif text-3xl text-ink">{stepNames[step - 1]}</h2>
      <form onSubmit={handleSubmit(placeOrder)} className="mt-7 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-8">
          {step === 1 && <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-3">{savedAddresses.length > 0 && <label className="block min-w-[220px] flex-1 text-sm font-medium text-ink-soft">Choose a saved address<select value={selectedSavedAddress} onChange={(event) => chooseSavedAddress(event.target.value)} className="field mt-2"><option value="">Use another address</option>{savedAddresses.map((address, index) => <option key={`${address.line1}-${address.postalCode}-${index}`} value={String(index)}>{address.addressType || 'Address'} · {address.line1}, {address.city}</option>)}</select></label>}<Link href="/account" className="pb-3 text-sm font-semibold text-primary hover:underline">Manage addresses</Link></div>
            <div className="grid gap-4 sm:grid-cols-2">{input('fullName', 'Full name', { autoComplete: 'name' })}{input('email', 'Email', { type: 'email', autoComplete: 'email', readOnly: true })}{input('phoneNumber', 'Phone number (10 digits)', { type: 'tel', autoComplete: 'tel', inputMode: 'numeric', maxLength: 10 })}</div>
            <div className="border-t border-line pt-5"><h3 className="flex items-center gap-2 font-semibold text-ink"><MapPin className="h-4 w-4 text-primary" /> Delivery address</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{input('addressLine1', 'Address line 1', { autoComplete: 'address-line1' })}{input('addressLine2', 'Address line 2 (optional)', { autoComplete: 'address-line2' })}{input('landmark', 'Landmark (optional)', { autoComplete: 'off' })}{input('city', 'City', { autoComplete: 'address-level2' })}{input('state', 'State', { autoComplete: 'address-level1' })}{input('pincode', 'Pincode (6 digits)', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 6 })}</div>
              <fieldset className="mt-5"><legend className="text-sm font-medium text-ink-soft">Address type</legend><div className="mt-2 flex gap-3">{(['Home', 'Work'] as const).map((type) => <label key={type} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm', form.addressType === type ? 'border-primary bg-primary-50 text-primary-900' : 'border-line text-ink-soft')}><input type="radio" value={type} {...register('addressType')} className="accent-primary" />{type}</label>)}</div>{errors.addressType && <span className="mt-1 block text-xs text-red-600">{errors.addressType.message}</span>}</fieldset>
              <label className="mt-5 flex items-start gap-3 text-sm text-ink-soft"><input type="checkbox" {...register('saveAddress')} className="mt-1 h-4 w-4 accent-primary" /><span>Save this address to my account for next time.</span></label>
              <label className="mt-5 block text-sm font-medium text-ink-soft">Delivery notes (optional)<textarea rows={3} {...register('notes')} className="field mt-2 h-auto py-3" placeholder="Gate code or delivery instructions" /></label>
            </div>
          </div>}
          {step === 2 && <div className="space-y-4">
            <div className="flex items-start gap-4 rounded-2xl border-2 border-primary bg-primary-50/60 p-5"><Truck className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="flex-1"><p className="font-semibold text-ink">Standard delivery</p><p className="mt-1 text-sm text-ink-muted">Delivery charges and availability are confirmed by the store.</p></div><p className="font-semibold text-ink">{quote ? (quote.shippingFee ? formatINR(quote.shippingFee) : 'Free') : '—'}</p></div>
            <div className="rounded-xl bg-canvas p-4 text-sm text-ink-soft">Payment method: <strong className="text-ink">Cash on Delivery</strong>. Pay the order total to the delivery agent when your order arrives.</div>
          </div>}
          {step === 3 && <div className="space-y-5">
            <div className="rounded-2xl bg-canvas p-5"><p className="font-semibold text-ink">Delivering to · {form.addressType}</p><p className="mt-2 text-sm leading-6 text-ink-soft">{form.fullName}<br />{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ''}{form.landmark ? `, near ${form.landmark}` : ''}<br />{form.city}, {form.state} {form.pincode}<br />{form.phoneNumber}</p><button type="button" onClick={() => setStep(1)} className="mt-3 text-sm font-semibold text-primary hover:underline">Edit address</button></div>
            <div className="flex items-center gap-3 rounded-2xl border border-line p-4"><Banknote className="h-5 w-5 text-primary" /><span className="text-sm font-medium text-ink">Cash on Delivery</span><span className="ml-auto text-xs text-ink-muted">No online payment</span></div>
            <p className="text-sm text-ink-muted">Product prices and stock are verified again by the server when you place your order.</p>
            <div className="border-t border-line pt-5"><label htmlFor="discount-code" className="block text-sm font-medium text-ink-soft">Discount code</label>{discountCode ? <div className="mt-2 flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-sm"><span className="font-semibold text-primary-900">{discountCode} applied</span><button type="button" className="font-semibold text-primary underline" onClick={() => { setDiscountCode(''); setDiscountInput(''); }}>Remove</button></div> : <div className="mt-2 flex gap-2"><input id="discount-code" value={discountInput} onChange={(event) => setDiscountInput(event.target.value.toUpperCase())} maxLength={30} className="field h-11 uppercase" placeholder="Enter code" /><Button type="button" variant="outline" loading={discountBusy} onClick={applyDiscount}>Apply</Button></div>}</div>
          </div>}
          {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-6 sm:flex-row sm:justify-between">
            {step > 1 ? <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}><ArrowLeft className="h-4 w-4" /> Back</Button> : <span />}
            {step < 3 ? <Button type="button" onClick={advance}>Continue <ArrowRight className="h-4 w-4" /></Button> : <Button type="submit" loading={placing} disabled={!quote || quoteLoading}><Lock className="h-4 w-4" /> Place Order (Cash on Delivery)</Button>}
          </div>
        </div>

        <aside className="h-fit rounded-3xl bg-canvas p-5 sm:p-7 lg:sticky lg:top-28">
          <h3 className="flex items-center gap-2 font-semibold text-ink"><PackageCheck className="h-5 w-5 text-primary" /> Order summary</h3>
          {quoteLoading ? <div className="flex items-center gap-2 py-8 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" /> Checking live prices and stock…</div> : quote ? <>
            <ul className="mt-5 divide-y divide-line">{quote.items.map((line) => { const item = items.find((entry) => entry.productId === line.product); return <li key={line.product} className="flex items-center gap-3 py-4"><div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-sand"><PlantImage src={line.image || item?.image} alt={line.name} seed={line.sku} sizes="48px" /><span className="absolute right-0 top-0 rounded-bl-md bg-ink px-1.5 py-0.5 text-[10px] text-white">{line.qty}</span></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{line.name}</p><p className="text-xs text-ink-muted">{line.sku} · {formatINR(line.price)} each</p></div><p className="text-sm font-semibold tabular-nums text-ink">{formatINR(line.lineTotal)}</p></li>; })}</ul>
            <dl className="space-y-3 border-t border-line pt-4 text-sm"><Money label="Subtotal" value={quote.subtotal} />{Boolean(quote.discount?.amount) && <div className="flex justify-between text-primary"><dt>Discount {quote.discount?.code && `(${quote.discount.code})`}</dt><dd>−{formatINR(quote.discount!.amount)}</dd></div>}<Money label="Shipping" value={quote.shippingFee} free /><Money label={`GST ${quote.tax.rate}%${quote.tax.included ? ' included' : ''}`} value={quote.tax.amount} /><div className="flex justify-between border-t border-line pt-4 text-lg font-semibold text-ink"><dt>Total due on delivery</dt><dd>{formatINR(quote.totalAmount)}</dd></div></dl>
            <p className="mt-4 text-xs leading-5 text-ink-muted">These prices come from the product catalog. The server recalculates the final order total at placement.</p>
          </> : <p className="mt-5 rounded-xl bg-white p-4 text-sm text-red-700">{error || 'Could not verify cart prices. Please refresh and try again.'}</p>}
        </aside>
      </form>
    </section>
  </>;
}

function Money({ label, value, free = false }: { label: string; value: number; free?: boolean }) {
  return <div className="flex justify-between text-ink-soft"><dt>{label}</dt><dd className="tabular-nums text-ink">{free && !value ? 'Free' : formatINR(value)}</dd></div>;
}
