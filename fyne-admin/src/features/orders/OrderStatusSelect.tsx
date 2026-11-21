'use client';

import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { P } from '@/lib/access';
import { OrderStatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ORDER_TRANSITIONS, useUpdateOrderStatus } from './useUpdateOrderStatus';

/**
 * Quick "Update Status" control. Shows only valid next states; users without
 * orders:update (admins by default) just see the badge.
 */
export function OrderStatusSelect({ orderId, orderNumber, status, className }: { orderId: string; orderNumber: number; status: OrderStatus; className?: string }) {
  const { can } = useAuth();
  const mutation = useUpdateOrderStatus();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const next = ORDER_TRANSITIONS[status];

  if (!can(P.ORDERS_UPDATE) || !next.length) return <OrderStatusBadge status={status} />;

  const update = (orderStatus: OrderStatus) => mutation.mutate({ id: orderId, orderStatus });

  return (
    <>
      <div className={cn('relative inline-flex items-center', className)} onClick={(e) => e.stopPropagation()}>
        <select
          aria-label={`Update status of order #${orderNumber}`}
          value=""
          disabled={mutation.isPending}
          onChange={(e) => {
            const v = e.target.value as OrderStatus;
            if (!v) return;
            if (v === 'Cancelled') setConfirmCancel(true);
            else update(v);
          }}
          className={cn(
            'h-7 cursor-pointer appearance-none rounded-full border py-0 pl-2.5 pr-7 text-xs font-medium transition focus:outline-none focus:shadow-ring',
            status === 'Pending' && 'border-secondary-200 bg-secondary-50 text-secondary-700',
            status === 'Shipped' && 'border-blue-200 bg-info-50 text-info'
          )}
        >
          <option value="">{status}</option>
          {next.map((s) => (
            <option key={s} value={s}>→ {s}</option>
          ))}
        </select>
        {mutation.isPending ? (
          <Loader2 className="pointer-events-none absolute right-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 opacity-70" />
        )}
      </div>
      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title={`Cancel order #${orderNumber}?`}
        message="Reserved stock will be returned to inventory. If the order was paid, you'll need to issue a refund from the payment gateway."
        confirmLabel="Cancel order"
        loading={mutation.isPending}
        onConfirm={() => mutation.mutate({ id: orderId, orderStatus: 'Cancelled' }, { onSettled: () => setConfirmCancel(false) })}
      />
    </>
  );
}
