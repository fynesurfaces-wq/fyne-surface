'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage, patch } from '@/lib/api';
import type { OrderStatus } from '@/lib/types';

/** Mirrors the backend state machine (services/order.service.js → TRANSITIONS). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

export interface StatusUpdate {
  id: string;
  orderStatus: OrderStatus;
  note?: string;
  tracking?: { carrier?: string; number?: string; url?: string };
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: StatusUpdate) => patch<{ data: unknown; warning?: string }>(`/admin/orders/${id}/status`, body),
    onSuccess: (res, vars) => {
      toast.success(`Order marked as ${vars.orderStatus}`);
      if (res.warning) toast.warning(res.warning);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', vars.id] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['navigation'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
