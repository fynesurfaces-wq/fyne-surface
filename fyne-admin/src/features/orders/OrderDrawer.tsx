'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Loader2, MapPin, Truck, User as UserIcon } from 'lucide-react';
import { get } from '@/lib/api';
import { qk } from '@/lib/queries';
import { P } from '@/lib/access';
import { useAuth } from '@/providers/AuthProvider';
import type { Order, OrderStatus } from '@/lib/types';
import { formatDate, formatINR } from '@/lib/utils';
import { Drawer } from '@/components/ui/Overlay';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Form';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Thumb } from '@/components/ui/misc';
import { ORDER_TRANSITIONS, useUpdateOrderStatus } from './useUpdateOrderStatus';

const METHOD_LABEL = { online: 'Online payment', cod: 'Cash on delivery', bank_transfer: 'Bank transfer' } as const;

export function OrderDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const { can } = useAuth();
  const { data: order, isLoading } = useQuery({
    queryKey: qk.order(orderId || ''),
    queryFn: () => get<{ data: Order }>(`/admin/orders/${orderId}`).then((r) => r.data),
    enabled: !!orderId,
  });

  return (
    <Drawer
      open={!!orderId}
      onClose={onClose}
      title={order ? `Order #${order.orderNumber}` : 'Order'}
      description={
        order && (
          <span className="flex flex-wrap items-center gap-2">
            {formatDate(order.createdAt, true)}
            <OrderStatusBadge status={order.orderStatus} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </span>
        )
      }
    >
      {isLoading || !order ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-6">
          {can(P.ORDERS_UPDATE) ? (
            <StatusUpdater order={order} />
          ) : (
            <p className="rounded-lg border border-border bg-gray-50 px-3 py-2.5 text-xs text-muted-foreground">Your role can view orders. Ask a Super Admin to update fulfilment status.</p>
          )}

          {/* Items */}
          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Items ({order.orderItems.reduce((s, i) => s + i.qty, 0)})</h3>
            <ul className="divide-y divide-border rounded-xl border border-border">
              {order.orderItems.map((it) => (
                <li key={it.sku} className="flex items-center gap-3 p-3">
                  <Thumb src={it.image} alt={it.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                    <p className="text-xs text-muted-foreground">{it.sku} · {formatINR(it.price)} × {it.qty}</p>
                  </div>
                  <p className="text-sm font-medium tabular-nums text-ink">{formatINR(it.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Totals */}
          <section className="rounded-xl border border-border bg-gray-50/60 p-4 text-sm">
            <Row label="Subtotal" value={formatINR(order.subtotal)} />
            {!!order.discount?.amount && <Row label={`Discount${order.discount.code ? ` (${order.discount.code})` : ''}`} value={`− ${formatINR(order.discount.amount)}`} accent />}
            <Row label="Shipping" value={order.shippingFee ? formatINR(order.shippingFee) : 'Free'} />
            <Row label={`GST ${order.tax.rate}%${order.tax.included ? ' (included)' : ''}`} value={formatINR(order.tax.amount)} muted />
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span className="tabular-nums">{formatINR(order.totalAmount)}</span>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoCard icon={<UserIcon className="h-4 w-4" />} title="Customer">
              <p className="font-medium text-ink">{order.user?.name || order.shippingAddress.fullName || '—'}</p>
              <p>{order.email}</p>
              {order.user?.phone && <p>{order.user.phone}</p>}
              {order.user?.ordersCount !== undefined && <p className="mt-1 text-xs">{order.user.ordersCount} order(s) · {formatINR(order.user.totalSpent)} spent</p>}
            </InfoCard>
            <InfoCard icon={<MapPin className="h-4 w-4" />} title="Shipping address">
              <p>{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
              {order.shippingAddress.phone && <p>{order.shippingAddress.phone}</p>}
            </InfoCard>
            <InfoCard icon={<CreditCard className="h-4 w-4" />} title="Payment">
              <p>{METHOD_LABEL[order.paymentMethod]}</p>
              {order.gatewayTransactionId && <p className="break-all font-mono text-xs">{order.gatewayTransactionId}</p>}
              {order.paidAt && <p className="text-xs">Paid {formatDate(order.paidAt, true)}</p>}
            </InfoCard>
            {order.tracking?.number && (
              <InfoCard icon={<Truck className="h-4 w-4" />} title="Tracking">
                <p>{order.tracking.carrier}</p>
                {order.tracking.url ? (
                  <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{order.tracking.number}</a>
                ) : (
                  <p className="font-mono">{order.tracking.number}</p>
                )}
              </InfoCard>
            )}
          </div>

          {/* Timeline */}
          {order.history?.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3>
              <ol className="relative space-y-4 border-l-2 border-primary-100 pl-5">
                {[...order.history].reverse().map((h, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${h.type === 'payment' ? 'bg-secondary' : 'bg-primary'}`} />
                    <p className="text-sm text-ink">
                      {h.type === 'payment' ? 'Payment' : h.type === 'order' ? 'Order' : 'Note'}
                      {h.status && <> · <span className="font-medium">{h.status}</span></>}
                    </p>
                    {h.note && <p className="text-xs text-ink-soft">{h.note}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(h.at, true)}{h.by?.name ? ` · ${h.by.name}` : ''}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}

function StatusUpdater({ order }: { order: Order }) {
  const next = ORDER_TRANSITIONS[order.orderStatus];
  const [target, setTarget] = useState<OrderStatus | ''>(next[0] ?? '');
  const [tracking, setTracking] = useState({ carrier: '', number: '', url: '' });
  const [confirm, setConfirm] = useState(false);
  const mutation = useUpdateOrderStatus();

  useEffect(() => setTarget(ORDER_TRANSITIONS[order.orderStatus][0] ?? ''), [order.orderStatus]);

  if (!next.length) {
    return <p className="rounded-lg border border-border bg-gray-50 px-3 py-2.5 text-xs text-muted-foreground">This order is {order.orderStatus.toLowerCase()} — no further status changes.</p>;
  }
  const unpaidOnline = target === 'Shipped' && order.paymentMethod === 'online' && order.paymentStatus !== 'Paid';

  const submit = () => {
    if (!target) return;
    const t = Object.fromEntries(Object.entries(tracking).filter(([, v]) => v.trim()));
    mutation.mutate({ id: order._id, orderStatus: target, ...(target === 'Shipped' && Object.keys(t).length && { tracking: t }) }, { onSettled: () => setConfirm(false) });
  };

  return (
    <section className="rounded-xl border border-primary-200 bg-primary-50/40 p-4">
      <h3 className="mb-3 text-sm font-semibold text-ink">Update status</h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field label="Move to" htmlFor="next-status" className="sm:w-48">
          <Select id="next-status" value={target} onChange={(e) => setTarget(e.target.value as OrderStatus)}>
            {next.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Button
          variant={target === 'Cancelled' ? 'danger' : 'primary'}
          loading={mutation.isPending}
          disabled={unpaidOnline}
          onClick={() => (target === 'Cancelled' ? setConfirm(true) : submit())}
        >
          Mark as {target}
        </Button>
      </div>
      {unpaidOnline && <p className="mt-2 text-xs text-secondary-700">Online orders can be shipped only after payment is confirmed.</p>}
      {target === 'Shipped' && !unpaidOnline && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Carrier" htmlFor="carrier"><Input id="carrier" placeholder="Delhivery" value={tracking.carrier} onChange={(e) => setTracking((t) => ({ ...t, carrier: e.target.value }))} /></Field>
          <Field label="Tracking no." htmlFor="trk"><Input id="trk" value={tracking.number} onChange={(e) => setTracking((t) => ({ ...t, number: e.target.value }))} /></Field>
          <Field label="Tracking URL" htmlFor="trk-url"><Input id="trk-url" type="url" placeholder="https://" value={tracking.url} onChange={(e) => setTracking((t) => ({ ...t, url: e.target.value }))} /></Field>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submit}
        loading={mutation.isPending}
        title={`Cancel order #${order.orderNumber}?`}
        message="Reserved stock returns to inventory. If the customer paid, issue a refund from your payment gateway."
        confirmLabel="Cancel order"
      />
    </section>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${muted ? 'text-xs text-muted-foreground' : 'text-ink-soft'}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${accent ? 'text-secondary-700' : ''}`}>{value}</span>
    </div>
  );
}

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span> {title}
      </p>
      <div className="space-y-0.5 text-sm text-ink-soft">{children}</div>
    </div>
  );
}
