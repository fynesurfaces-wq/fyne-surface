'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Circle, Package, Truck } from 'lucide-react';
import { api, apiError } from '@/lib/api.client';
import { formatINR } from '@/lib/utils';
import { ButtonLink } from '@/components/ui/Button';

type Order = {
  _id: string; orderNumber: number; orderItems: { name: string; sku: string; image?: string; price: number; qty: number; lineTotal: number }[];
  shippingAddress: { fullName?: string; phone?: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country?: string };
  subtotal: number; shippingFee: number; tax: { amount: number; rate: number; included: boolean }; totalAmount: number; currency: string;
  orderStatus: string; paymentStatus: string; paymentMethod: string; tracking?: { carrier?: string; number?: string; url?: string };
  history: { type: string; status?: string; note?: string; at: string }[]; createdAt: string; shippedAt?: string; deliveredAt?: string;
};
const FLOW = ['Pending', 'Processing', 'Shipped', 'Delivered'];

export function CustomerOrderDetails({ orderId, success = false }: { orderId: string; success?: boolean }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();
  useEffect(() => {
    let active = true;
    api.get<{ data: Order }>(`/orders/${encodeURIComponent(orderId)}`).then(({ data }) => { if (active) setOrder(data.data); }).catch((err) => { if (!active) return; const code = apiError(err).code; if (['CUSTOMER_AUTH_REQUIRED', 'CUSTOMER_SESSION_EXPIRED', 'CUSTOMER_NOT_VERIFIED'].includes(code)) router.replace(`/login?redirect=${encodeURIComponent(`${success ? '/order-success' : '/account/orders'}/${orderId}`)}`); else setError(apiError(err).message); });
    return () => { active = false; };
  }, [orderId, router, success]);

  if (error) return <section className="container max-w-3xl py-12"><div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error}<p className="mt-2 text-xs">If this order belongs to another account, its details are not available here.</p></div><Link href="/account/orders" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> Your orders</Link></section>;
  if (!order) return <section className="container max-w-3xl py-12" aria-busy="true"><div className="h-40 animate-pulse rounded-3xl bg-canvas" /></section>;
  const canceled = order.orderStatus === 'Cancelled';
  const current = FLOW.indexOf(order.orderStatus);
  return <section className="container max-w-4xl pb-24 pt-10 sm:pt-14">
    {success && <div className="mb-8 rounded-3xl border border-primary-100 bg-primary-50 p-6 sm:p-8"><p className="text-eyebrow uppercase text-primary">Order received</p><h2 className="mt-2 font-serif text-3xl text-ink">Thank you for your order.</h2><p className="mt-3 text-sm leading-6 text-ink-soft">Your Cash on Delivery order is confirmed. You can follow its progress below.</p></div>}
    <Link href="/account/orders" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> All orders</Link>
    <div className="mt-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-eyebrow uppercase text-accent-700">Order tracking</p><h1 className="mt-2 font-serif text-3xl text-ink">Order #{order.orderNumber}</h1><p className="mt-2 text-sm text-ink-muted">Placed {new Date(order.createdAt).toLocaleString('en-IN')}</p></div><p className="rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-900">{order.orderStatus}</p></div>
    <section className="mt-8 rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-8"><h2 className="font-semibold text-ink">Delivery progress</h2>{canceled ? <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">This order was cancelled.</p> : <ol className="mt-7 grid grid-cols-2 gap-y-7 sm:grid-cols-4">{FLOW.map((status, index) => { const complete = index <= current; const event = order.history.find((item) => item.type === 'order' && item.status === status); const Icon = index === 2 ? Truck : index === 3 ? Package : complete ? Check : Circle; return <li key={status} className="relative flex items-center gap-3 sm:flex-col sm:items-start"><span className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-primary text-white' : 'bg-canvas text-ink-faint'}`}><Icon className="h-4 w-4" /></span><span><span className={`block text-sm font-semibold ${complete ? 'text-ink' : 'text-ink-muted'}`}>{status}</span>{event && <span className="mt-1 block text-xs text-ink-muted">{new Date(event.at).toLocaleDateString('en-IN')}</span>}</span>{index < FLOW.length - 1 && <span className={`absolute left-9 top-4 hidden h-0.5 w-[calc(100%-1.5rem)] sm:block ${index < current ? 'bg-primary' : 'bg-line'}`} />}</li>; })}</ol>}
      {order.tracking?.number && <div className="mt-7 rounded-2xl bg-canvas p-4 text-sm"><p className="font-semibold text-ink">Shipment details</p><p className="mt-1 text-ink-soft">{order.tracking.carrier || 'Carrier'} · {order.tracking.number}</p>{order.tracking.url && <a className="mt-2 inline-block font-semibold text-primary underline" href={order.tracking.url} target="_blank" rel="noopener noreferrer">Track shipment</a>}</div>}
    </section>
    <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_300px]">
      <section className="rounded-3xl border border-line bg-white p-5 sm:p-7"><h2 className="font-semibold text-ink">Items</h2><ul className="mt-4 divide-y divide-line">{order.orderItems.map((item) => <li key={item.sku} className="flex justify-between gap-4 py-4"><div><p className="font-medium text-ink">{item.name}</p><p className="mt-1 text-xs text-ink-muted">{item.sku} · Qty {item.qty}</p></div><p className="font-medium tabular-nums text-ink">{formatINR(item.lineTotal)}</p></li>)}</ul></section>
      <aside className="h-fit rounded-3xl bg-canvas p-5 sm:p-7"><h2 className="font-semibold text-ink">Order total</h2><dl className="mt-4 space-y-3 text-sm"><Row label="Subtotal" value={formatINR(order.subtotal)} /><Row label="Shipping" value={order.shippingFee ? formatINR(order.shippingFee) : 'Free'} /><Row label={`GST ${order.tax.rate}%`} value={formatINR(order.tax.amount)} /><Row label="Payment" value={order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentStatus} /><div className="flex justify-between border-t border-line pt-4 text-base font-semibold text-ink"><dt>Total due</dt><dd>{formatINR(order.totalAmount)}</dd></div></dl><div className="mt-6 border-t border-line pt-5 text-sm leading-6 text-ink-soft"><p className="font-semibold text-ink">Deliver to</p><p className="mt-2">{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.phone}</p></div></aside>
    </div>
    {success && <ButtonLink href="/collections" className="mt-8">Continue shopping</ButtonLink>}
  </section>;
}

function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3 text-ink-soft"><dt>{label}</dt><dd className="text-right text-ink">{value}</dd></div>; }
