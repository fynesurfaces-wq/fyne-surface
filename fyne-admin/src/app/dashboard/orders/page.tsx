'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ShoppingBag } from 'lucide-react';
import { get } from '@/lib/api';
import { qk } from '@/lib/queries';
import type { ListResponse, OrderListItem, OrderStatus, PaymentStatus } from '@/lib/types';
import { formatDate, formatINR } from '@/lib/utils';
import { DataTable, FilterSelect, defaultTableState, type Column, type TableState } from '@/components/data-table/DataTable';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/misc';
import { OrderDrawer } from '@/features/orders/OrderDrawer';
import { OrderStatusSelect } from '@/features/orders/OrderStatusSelect';

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
const PAYMENT_STATUSES: PaymentStatus[] = ['Pending', 'Paid', 'Failed', 'Refunded'];

function OrdersView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [table, setTable] = useState<TableState>(() => defaultTableState());
  const [orderStatus, setOrderStatus] = useState(params.get('orderStatus') ?? '');
  const [paymentStatus, setPaymentStatus] = useState(params.get('paymentStatus') ?? '');
  const [openId, setOpenId] = useState<string | null>(params.get('open'));

  useEffect(() => {
    const id = params.get('open');
    if (id) setOpenId(id);
    const s = params.get('orderStatus');
    if (s) setOrderStatus(s);
  }, [params]);

  const queryParams = { ...table, q: table.q || undefined, orderStatus: orderStatus || undefined, paymentStatus: paymentStatus || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: qk.orders(queryParams),
    queryFn: () => get<ListResponse<OrderListItem>>('/admin/orders', { params: queryParams }),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const closeDrawer = () => {
    setOpenId(null);
    if (params.get('open')) router.replace(pathname);
  };

  const columns: Column<OrderListItem>[] = [
    {
      id: 'order',
      header: 'Order ID',
      sortKey: 'orderNumber',
      hideable: false,
      cell: (o) => (
        <div>
          <p className="font-semibold text-ink">#{o.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatDate(o.createdAt, true)}</p>
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      cell: (o) => (
        <div className="min-w-[160px]">
          <p className="font-medium text-ink">{o.user?.name || '—'}</p>
          <p className="truncate text-xs text-muted-foreground">{o.email}</p>
        </div>
      ),
    },
    { id: 'items', header: 'Items', cell: (o) => <span className="tabular-nums">{o.itemCount ?? '—'}</span>, defaultHidden: true },
    { id: 'total', header: 'Total', sortKey: 'totalAmount', headerClassName: 'text-right', className: 'text-right font-medium tabular-nums text-ink', cell: (o) => formatINR(o.totalAmount) },
    {
      id: 'payment',
      header: 'Payment',
      cell: (o) => (
        <div className="flex flex-col items-start gap-1">
          <PaymentStatusBadge status={o.paymentStatus} />
          {o.paymentMethod !== 'online' && <span className="text-[11px] uppercase text-muted-foreground">{o.paymentMethod.replace('_', ' ')}</span>}
        </div>
      ),
    },
    { id: 'status', header: 'Order status', cell: (o) => <OrderStatusSelect orderId={o._id} orderNumber={o.orderNumber} status={o.orderStatus} /> },
  ];

  const resetPage = () => setTable((t) => ({ ...t, page: 1 }));

  return (
    <>
      <PageHeader title="Orders" description="Track payments and fulfil orders." />
      <DataTable
        storageKey="orders"
        columns={columns}
        data={data?.data}
        pagination={data?.pagination}
        rowKey={(o) => o._id}
        state={table}
        onStateChange={setTable}
        isLoading={isLoading}
        isFetching={isFetching}
        searchPlaceholder="Search #order, email or SKU…"
        onRowClick={(o) => setOpenId(o._id)}
        toolbar={
          <>
            <FilterSelect label="Order status" value={orderStatus} onChange={(v) => { setOrderStatus(v); resetPage(); }}>
              <option value="">All order statuses</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
            <FilterSelect label="Payment status" value={paymentStatus} onChange={(v) => { setPaymentStatus(v); resetPage(); }}>
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </FilterSelect>
          </>
        }
        empty={{ icon: <ShoppingBag className="h-5 w-5" />, title: 'No orders found', description: 'Orders from your storefront will appear here.' }}
      />
      <OrderDrawer orderId={openId} onClose={closeDrawer} />
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersView />
    </Suspense>
  );
}
