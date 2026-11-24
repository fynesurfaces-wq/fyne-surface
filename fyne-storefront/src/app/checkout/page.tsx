'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Banknote, CheckCircle2, CreditCard, Loader2, Lock, Tag, X } from 'lucide-react';
import { api, apiError } from '@/lib/api.client';
import { cn, formatINR } from '@/lib/utils';
import { selectSubtotal, useCart, type CartItem } from '@/store/cart';
import { estimateShipping, useStoreSettings } from '@/lib/useStoreSettings';
import { Button, ButtonLink } from '@/components/ui/Button';
import { PlantImage } from '@/components/ui/PlantImage';

const MOCK_PAYMENTS = process.env.NEXT_PUBLIC_MOCK_PAYMENTS !== 'false';

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name').max(100),
  email: z.string().trim().toLowerCase().email('Please enter a valid email'),
  phone: z.string().trim().regex(/^(?:\+?91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  line1: z.string().trim().min(3, 'Please enter your address').max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, 'Please enter your city').max(80),
  state: z.string().min(2, 'Please select your state'),
  postalCode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code'),
  notes: z.string().max(1000).optional(),
  acceptsMarketing: z.boolean(),
  paymentMethod: z.enum(['online', 'cod']),
});
type Values = z.infer<typeof schema>;

interface OrderResult {
  order: { id: string; orderNumber: number; paymentStatus: string; paymentMethod: string; items: { name: string; sku: string; qty: number; lineTotal: number }[]; subtotal: number; discount?: { code?: string; amount: number }; shippingFee: number; tax: { amount: number; rate: number; included: boolean }; totalAmount: number };
  payment: { id: string; amount: number } | null;
}

/** Map backend 422 paths (customer.email, shippingAddress.city…) to form fields. */
const FIELD_MAP: Record<string, keyof Values> = {
  'customer.name': 'name', 'customer.email': 'email', 'customer.phone': 'phone',
  'shippingAddress.line1': 'line1', 'shippingAddress.line2': 'line2', 'shippingAddress.city': 'city',
  'shippingAddress.state': 'state', 'shippingAddress.postalCode': 'postalCode', 'shippingAddress.phone': 'phone',
};

export default function CheckoutPage() {
  const { items, hydrated, clear } = useCart();
  const subtotal = useCart(selectSubtotal);
  const settings = useStoreSettings();
  const [stage, setStage] = useState<'form' | 'paying' | 'done'>('form');
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState<{ code: string; amount: number; freeShipping: boolean } | null>(null);
  const [discountState, setDiscountState] = useState<{ loading: boolean; error?: string }>({ loading: false });

  const { register, handleSubmit, setError: setFieldError, watch, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'online', acceptsMarketing: false, state: '' },
  });
  const paymentMethod = watch('paymentMethod');

  const discountAmount = discount?.amount || 0;
  const shipping = estimateShipping(subtotal - discountAmount, settings, discount?.freeShipping);
  const total = Math.max(0, subtotal - discountAmount) + shipping;

  const applyDiscount = async () => {
    if (!code.trim()) return;
    setDiscountState({ loading: true });
    try {
      const { data } = await api.post('/store/discounts/validate', { code: code.trim(), items: items.map((i) => ({ product: i.productId, qty: i.qty })), email: watch('email') || undefined });
      setDiscount({ code: data.data.code, amount: data.data.discountAmount, freeShipping: data.data.freeShipping });
      setDiscountState({ loading: false });
    } catch (err) {
      setDiscount(null);
      setDiscountState({ loading: false, error: apiError(err).message });
    }
  };

  const onSubmit = async (v: Values) => {
    setError(null);
    try {
      const { data } = await api.post<{ data: OrderResult }>('/store/checkout', {
        customer: { name: v.name, email: v.email, phone: v.phone, acceptsMarketing: v.acceptsMarketing },
        items: items.map((i) => ({ product: i.productId, qty: i.qty })),
        shippingAddress: { fullName: v.name, phone: v.phone, line1: v.line1, line2: v.line2 || undefined, city: v.city, state: v.state, postalCode: v.postalCode, country: 'IN' },
        discountCode: discount?.code,
        paymentMethod: v.paymentMethod,
        notes: v.notes || undefined,
      });
      const res = data.data;

      // Payment placeholder: the backend returned a mock payment intent. In dev we
      // fire the backend's signed mock webhook so the order is marked Paid exactly
      // as a real gateway (Razorpay/Stripe) would do.
      if (v.paymentMethod === 'online' && res.payment && MOCK_PAYMENTS) {
        setStage('paying');
        await new Promise((r) => setTimeout(r, 1200));
        try {
          await api.post('/payments/mock/simulate', { orderId: res.order.id, outcome: 'success' });
          res.order.paymentStatus = 'Paid';
        } catch {
          /* order still exists as Pending — shown on the success screen */
        }
      }
      setResult(res);
      setStage('done');
      clear();
      window.scrollTo({ top: 0 });
    } catch (err) {
      setStage('form');
      const e = apiError(err);
      if (e.code === 'VALIDATION_ERROR' && Array.isArray(e.details)) {
        (e.details as { field: string; message: string }[]).forEach((d) => FIELD_MAP[d.field] && setFieldError(FIELD_MAP[d.field], { message: d.message }));
        setError('Please check the highlighted fields.');
      } else if (e.code === 'INSUFFICIENT_STOCK' && Array.isArray(e.details)) {
        setError(`Some items don’t have enough stock: ${(e.details as { sku: string; available: number }[]).map((d) => `${d.sku} (only ${d.available} left)`).join(', ')}. Please update your cart.`);
      } else if (e.code === 'DISCOUNT_INVALID') {
        setDiscount(null);
        setDiscountState({ loading: false, error: e.message });
        setError(e.message);
      } else {
        setError(e.message);
      }
    }
  };

  // ── Success ──
  if (stage === 'done' && result) return <Success result={result} />;

  if (!hydrated) return <section className="container min-h-[60vh] py-20" aria-busy="true"><h1 className="text-display-md text-ink">Secure checkout for artificial plants in Mumbai</h1></section>;

  if (!items.length) {
    return (
      <section className="container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <h1 className="text-display-md text-ink">Your artificial plants cart in Mumbai is empty</h1>
        <p className="mt-3 text-lg text-ink-muted">Add a few plants before checking out.</p>
        <ButtonLink href="/collections" size="lg" className="mt-10">Explore collections</ButtonLink>
      </section>
    );
  }

  const field = (name: keyof Values) => cn('field', errors[name] && 'field-invalid');
  const Err = ({ name }: { name: keyof Values }) => (errors[name] ? <p className="mt-1.5 text-[13px] text-red-600">{errors[name]?.message as string}</p> : null);

  return (
    <section className="container pb-28 pt-10 lg:pt-14">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to cart</Link>
      <h1 className="mt-6 text-display-md text-ink">Secure checkout for artificial plants in Mumbai</h1>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="space-y-12 lg:col-span-7">
          {/* Contact */}
          <fieldset>
            <legend className="text-lg font-semibold text-ink">Contact</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-soft">Full name</label>
                <input id="name" autoComplete="name" className={field('name')} {...register('name')} />
                <Err name="name" />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-soft">Email</label>
                <input id="email" type="email" autoComplete="email" className={field('email')} {...register('email')} />
                <Err name="email" />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink-soft">Mobile number</label>
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="98765 43210" className={field('phone')} {...register('phone')} />
                <Err name="phone" />
              </div>
            </div>
            <label className="mt-4 flex items-center gap-3 text-sm text-ink-soft">
              <input type="checkbox" className="h-4 w-4 rounded border-line accent-primary" {...register('acceptsMarketing')} /> Email me about new collections and offers
            </label>
          </fieldset>

          {/* Shipping */}
          <fieldset>
            <legend className="text-lg font-semibold text-ink">Shipping address</legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="line1" className="mb-1.5 block text-sm font-medium text-ink-soft">Address</label>
                <input id="line1" autoComplete="address-line1" placeholder="House / flat no., building, street" className={field('line1')} {...register('line1')} />
                <Err name="line1" />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="line2" className="mb-1.5 block text-sm font-medium text-ink-soft">Apartment, area, landmark <span className="text-ink-faint">(optional)</span></label>
                <input id="line2" autoComplete="address-line2" className={field('line2')} {...register('line2')} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-ink-soft">City</label>
                <input id="city" autoComplete="address-level2" className={field('city')} {...register('city')} />
                <Err name="city" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="state" className="mb-1.5 block text-sm font-medium text-ink-soft">State</label>
                <select id="state" autoComplete="address-level1" className={cn(field('state'), 'appearance-none')} {...register('state')}>
                  <option value="">Select…</option>
                  {STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <Err name="state" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="postalCode" className="mb-1.5 block text-sm font-medium text-ink-soft">PIN code</label>
                <input id="postalCode" inputMode="numeric" autoComplete="postal-code" maxLength={6} className={field('postalCode')} {...register('postalCode')} />
                <Err name="postalCode" />
              </div>
              <div className="sm:col-span-6">
                <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-ink-soft">Delivery notes <span className="text-ink-faint">(optional)</span></label>
                <textarea id="notes" rows={3} className="field h-auto py-3" placeholder="e.g. Deliver to reception, call before arriving" {...register('notes')} />
              </div>
            </div>
          </fieldset>

          {/* Payment */}
          <fieldset>
            <legend className="text-lg font-semibold text-ink">Payment</legend>
            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup">
              {([
                { value: 'online', icon: CreditCard, title: 'Pay online', text: MOCK_PAYMENTS ? 'UPI, cards & netbanking (mock payment)' : 'UPI, cards & netbanking' },
                { value: 'cod', icon: Banknote, title: 'Cash on delivery', text: 'Pay when your order arrives' },
              ] as const).map((m) => (
                <label key={m.value} className={cn('flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition', paymentMethod === m.value ? 'border-primary bg-primary-50/50 ring-4 ring-primary/10' : 'border-line hover:border-ink/30')}>
                  <input type="radio" value={m.value} className="sr-only" {...register('paymentMethod')} onChange={() => setValue('paymentMethod', m.value)} />
                  <m.icon className={cn('mt-0.5 h-5 w-5', paymentMethod === m.value ? 'text-primary' : 'text-ink-muted')} />
                  <span>
                    <span className="block font-semibold text-ink">{m.title}</span>
                    <span className="mt-0.5 block text-[13px] text-ink-muted">{m.text}</span>
                  </span>
                </label>
              ))}
            </div>
            {MOCK_PAYMENTS && paymentMethod === 'online' && (
              <p className="mt-4 rounded-xl bg-accent-50 px-4 py-3 text-[13px] text-accent-700">
                Test mode: no real payment is taken. The order is confirmed through the store’s mock payment gateway.
              </p>
            )}
          </fieldset>
        </div>

        {/* Summary */}
        <aside className="lg:col-span-5" aria-labelledby="order-summary">
          <div className="rounded-[1.75rem] bg-canvas p-7 lg:sticky lg:top-28 lg:p-8">
            <h2 id="order-summary" className="text-lg font-semibold text-ink">Order summary</h2>
            <ul className="mt-6 space-y-5">
              {items.map((i: CartItem) => (
                <li key={i.productId} className="flex items-center gap-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-sand">
                    <PlantImage src={i.image} alt={i.name} seed={i.slug} sizes="64px" />
                    <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink px-1 text-[11px] font-semibold text-white">{i.qty}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{i.name}</p>
                    <p className="text-xs text-ink-muted">{i.sku}</p>
                  </div>
                  <p className="font-medium tabular-nums text-ink">{formatINR(i.price * i.qty)}</p>
                </li>
              ))}
            </ul>

            {/* Discount */}
            <div className="mt-7 border-t border-line pt-6">
              {discount ? (
                <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-primary-800"><Tag className="h-4 w-4" /> {discount.code} applied</span>
                  <button type="button" onClick={() => { setDiscount(null); setCode(''); }} className="text-primary-800 hover:text-ink" aria-label="Remove discount"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <label htmlFor="discount" className="sr-only">Discount code</label>
                  <input id="discount" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Discount code" className="field h-11 uppercase" />
                  <Button type="button" variant="outline" className="h-11" onClick={applyDiscount} loading={discountState.loading}>Apply</Button>
                </div>
              )}
              {discountState.error && <p className="mt-2 text-[13px] text-red-600">{discountState.error}</p>}
            </div>

            <dl className="mt-6 space-y-3 text-[15px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums text-ink">{formatINR(subtotal)}</dd></div>
              {discountAmount > 0 && <div className="flex justify-between text-primary"><dt>Discount</dt><dd className="tabular-nums">−{formatINR(discountAmount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="tabular-nums text-ink">{shipping ? formatINR(shipping) : 'Free'}</dd></div>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <dt className="text-lg font-semibold text-ink">Total</dt>
                <dd className="text-2xl font-semibold tabular-nums text-ink">{formatINR(total)}</dd>
              </div>
            </dl>
            <p className="mt-1 text-xs text-ink-muted">Inclusive of GST. Final amount is confirmed by our server when you place the order.</p>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <Button type="submit" size="xl" className="mt-7 w-full" loading={isSubmitting || stage === 'paying'}>
              {stage === 'paying' ? 'Processing payment…' : (<><Lock className="h-4 w-4" />{paymentMethod === 'online' ? (MOCK_PAYMENTS ? 'Place Order (Mock Payment)' : 'Place Order & Pay') : 'Place Order'}</>)}
            </Button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-muted"><Lock className="h-3 w-3" /> Your details are sent securely.</p>
          </div>
        </aside>
      </form>

      {/* Payment overlay */}
      <AnimatePresence>
        {stage === 'paying' && (
          <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-white/80 backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="status">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="mt-5 text-lg font-semibold text-ink">Confirming your payment…</p>
              <p className="mt-1 text-sm text-ink-muted">Please don’t close this window.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Success({ result }: { result: OrderResult }) {
  const o = result.order;
  const paid = o.paymentStatus === 'Paid';
  return (
    <section className="container max-w-2xl pb-28 pt-16 text-center lg:pt-24">
      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary">
        <CheckCircle2 className="h-10 w-10" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}>
        <p className="mt-8 text-eyebrow uppercase text-accent">Order #{o.orderNumber}</p>
        <h1 className="mt-3 text-display-md text-ink">Your artificial plants order is placed</h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-muted">
          {o.paymentMethod === 'cod'
            ? 'You’ll pay on delivery. Our team will contact you to schedule dispatch.'
            : paid
              ? 'Payment received. Our team will contact you to schedule dispatch.'
              : 'Your order is saved and awaiting payment confirmation.'}
        </p>

        <div className="mt-12 rounded-[1.75rem] bg-canvas p-7 text-left">
          <ul className="divide-y divide-line">
            {o.items.map((i) => (
              <li key={i.sku} className="flex justify-between gap-4 py-3 text-[15px]">
                <span className="text-ink-soft">{i.name} <span className="text-ink-faint">× {i.qty}</span></span>
                <span className="tabular-nums text-ink">{formatINR(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[15px]">
            {!!o.discount?.amount && <div className="flex justify-between text-primary"><dt>Discount {o.discount.code && `(${o.discount.code})`}</dt><dd>−{formatINR(o.discount.amount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd>{o.shippingFee ? formatINR(o.shippingFee) : 'Free'}</dd></div>
            <div className="flex justify-between text-xs text-ink-muted"><dt>GST {o.tax.rate}% {o.tax.included ? '(included)' : ''}</dt><dd>{formatINR(o.tax.amount)}</dd></div>
            <div className="flex justify-between pt-2 text-lg font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatINR(o.totalAmount)}</dd></div>
            <div className="flex justify-between pt-1 text-sm"><dt className="text-ink-soft">Payment</dt><dd className={paid ? 'font-medium text-primary' : 'text-accent-700'}>{o.paymentMethod === 'cod' ? 'Cash on delivery' : o.paymentStatus}</dd></div>
          </dl>
        </div>
        <ButtonLink href="/collections" size="lg" className="mt-10">Continue shopping</ButtonLink>
      </motion.div>
    </section>
  );
}
