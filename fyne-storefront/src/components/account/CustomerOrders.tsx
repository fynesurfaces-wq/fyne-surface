'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, PackageSearch } from 'lucide-react';
import { api } from '@/lib/api.client';
import { formatINR } from '@/lib/utils';

type OrderListItem = { _id: string; orderNumber: number; orderItems: { name: string; qty: number }[]; totalAmount: number; currency: string; orderStatus: string; paymentStatus: string; paymentMethod: string; createdAt: string };

export function CustomerOrders() {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const router = useRouter();
  useEffect(() => {
    let active = true;
    api.get<{ data: OrderListItem[] }>('/orders/my-orders?limit=50').then(({ data }) => { if (active) { setOrders(data.data); setState('ready'); } }).catch((error) => { if (!active) return; const code = error?.response?.data?.error?.code; if (['CUSTOMER_AUTH_REQUIRED', 'CUSTOMER_SESSION_EXPIRED', 'CUSTOMER_NOT_VERIFIED'].includes(code)) router.replace(`/login?redirect=${encodeURIComponent('/account/orders')}`); else setState('error'); });
    return () => { active = false; };
  }, [router]);

  if (state === 'loading') return <p role="status" className="rounded-2xl border border-line bg-white p-6 text-sm text-ink-muted">Loading your orders…</p>;
  if (state === 'error') return <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">We couldn’t load your orders. Please refresh and try again.</p>;
  if (!orders.length) return <div className="rounded-3xl border border-line bg-white p-8 text-center"><PackageSearch className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-4 font-serif text-2xl text-ink">No orders yet</h2><p className="mt-2 text-sm text-ink-muted">Your placed orders and delivery updates will appear here.</p><Link href="/collections" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Browse collections</Link></div>;
  return <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">{orders.map((order) => <li key={order._id}><Link href={`/account/orders/${order._id}`} className="block p-5 transition hover:bg-primary-50/40 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold text-ink">Order #{order.orderNumber}</p><p className="mt-1 text-xs text-ink-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')} · {order.orderItems.reduce((count, item) => count + item.qty, 0)} items</p></div><div className="text-right"><p className="font-semibold text-ink">{formatINR(order.totalAmount)}</p><p className="mt-1 text-xs text-ink-muted">{order.orderStatus} · {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentStatus}</p></div></div><div className="mt-4 flex items-center justify-between gap-3"><p className="line-clamp-1 text-sm text-ink-soft">{order.orderItems.map((item) => `${item.name} × ${item.qty}`).join(', ')}</p><span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary">Track <ArrowRight className="h-4 w-4" /></span></div></Link></li>)}</ul>;
}
