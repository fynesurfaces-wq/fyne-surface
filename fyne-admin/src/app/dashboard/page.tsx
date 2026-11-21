'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, IndianRupee, Package, PackageX, ShoppingBag } from 'lucide-react';
import { get } from '@/lib/api';
import { qk } from '@/lib/queries';
import { useAuth } from '@/providers/AuthProvider';
import { P } from '@/lib/access';
import { formatDate, formatINR, formatNumber } from '@/lib/utils';
import type { DashboardData } from '@/lib/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, EmptyState, PageHeader, Spinner, Thumb } from '@/components/ui/misc';
import { PaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OrderStatusPie, SalesChart } from '@/features/dashboard/Charts';
import { OrderStatusSelect } from '@/features/orders/OrderStatusSelect';

const RANGES = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
  { value: 90, label: '90 days' },
];

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export default function DashboardPage() {
  const router = useRouter();
  const { user, can } = useAuth();
  const [days, setDays] = useState(30);
  const canOrders = can(P.ORDERS_READ);

  const range = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86400000);
    return { from: isoDay(from), to: isoDay(to) };
  }, [days]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: qk.dashboard(`${range.from}_${range.to}`),
    queryFn: () => get<{ data: DashboardData }>('/admin/analytics/dashboard', { params: range }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const s = data?.stats;
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <>
      <PageHeader
        title={`${greeting}, ${user?.name.split(' ')[0] ?? ''}`}
        description="Here's what's happening with FYNE SURFACES."
        actions={
          <div className="inline-flex rounded-lg border border-border bg-white p-0.5 shadow-sm" role="group" aria-label="Date range">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setDays(r.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${days === r.value ? 'bg-primary text-white shadow-sm' : 'text-ink-soft hover:bg-muted'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {isError && (
        <Card className="mb-6 p-5 text-sm text-danger">
          Couldn&apos;t load dashboard data. <button className="font-medium underline" onClick={() => refetch()}>Retry</button>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canOrders && (
          <StatCard
            label="Total Revenue"
            value={formatINR(s?.totalRevenue)}
            icon={<IndianRupee className="h-5 w-5" />}
            change={data?.changes?.revenue}
            hint={`vs previous ${days} days`}
            loading={isLoading}
          />
        )}
        {canOrders && (
          <StatCard
            label="Total Orders"
            value={formatNumber(s?.totalOrders)}
            icon={<ShoppingBag className="h-5 w-5" />}
            accent="orange"
            change={data?.changes?.orders}
            hint={s?.ordersToFulfill ? `${s.ordersToFulfill} to fulfil` : undefined}
            loading={isLoading}
            onClick={() => router.push('/dashboard/orders')}
          />
        )}
        <StatCard
          label="Total Products"
          value={formatNumber(s?.totalProducts)}
          icon={<Package className="h-5 w-5" />}
          hint={s ? `${s.activeProducts} active · ${s.outOfStockProducts} out of stock` : undefined}
          loading={isLoading}
          onClick={() => router.push('/dashboard/products')}
        />
        <StatCard
          label="Low Stock Alerts"
          value={formatNumber(s?.lowStockCount)}
          icon={<AlertTriangle className="h-5 w-5" />}
          accent="orange"
          hint={s?.lowStockCount ? 'Needs restocking' : 'All stocked up'}
          loading={isLoading}
          onClick={() => router.push('/dashboard/products?stockStatus=low_stock')}
        />
      </div>

      {/* Charts */}
      {canOrders && (
        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Sales over time" description={`Paid revenue and orders · last ${days} days (IST)`} />
            <div className="px-3 pb-4 pt-2">
              {isLoading ? <ChartSkeleton /> : data?.salesOverTime ? <SalesChart data={data.salesOverTime} /> : null}
            </div>
          </Card>
          <Card>
            <CardHeader title="Order status" description="Orders placed in this period" />
            <div className="p-5">{isLoading ? <ChartSkeleton h={260} /> : <OrderStatusPie data={data?.ordersByStatus || {}} />}</div>
          </Card>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent orders */}
        {canOrders && (
          <Card className="xl:col-span-2">
            <CardHeader
              title="Recent orders"
              action={
                <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-700">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
            {isLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : data?.recentOrders?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-5 py-2.5 font-medium">Order</th>
                      <th className="px-5 py-2.5 font-medium">Customer</th>
                      <th className="px-5 py-2.5 text-right font-medium">Total</th>
                      <th className="px-5 py-2.5 font-medium">Payment</th>
                      <th className="px-5 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recentOrders.map((o) => (
                      <tr key={o._id} className="cursor-pointer hover:bg-primary-50/40" onClick={() => router.push(`/dashboard/orders?open=${o._id}`)}>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-ink">#{o.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(o.createdAt, true)}</p>
                        </td>
                        <td className="max-w-[200px] truncate px-5 py-3 text-ink-soft">{o.email}</td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums text-ink">{formatINR(o.totalAmount)}</td>
                        <td className="px-5 py-3"><PaymentStatusBadge status={o.paymentStatus} /></td>
                        <td className="px-5 py-3"><OrderStatusSelect orderId={o._id} orderNumber={o.orderNumber} status={o.orderStatus} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title="No orders yet" description="New orders from your store will appear here." />
            )}
          </Card>
        )}

        {/* Low stock */}
        <Card className={canOrders ? '' : 'xl:col-span-3'}>
          <CardHeader
            title="Low stock alerts"
            description="Products at or below their threshold"
            action={
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/products?stockStatus=low_stock')}>
                Manage
              </Button>
            }
          />
          {isLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : data?.lowStockAlerts.length ? (
            <ul className="divide-y divide-border">
              {data.lowStockAlerts.map((p) => (
                <li key={p._id}>
                  <Link href={`/dashboard/products?edit=${p._id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50">
                    <Thumb src={p.thumbnail} alt={p.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        p.severity === 'critical' ? 'bg-danger-50 text-danger' : 'bg-secondary-50 text-secondary-700'
                      }`}
                    >
                      {p.severity === 'critical' && <PackageX className="h-3 w-3" />}
                      {p.stock} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={<Package className="h-5 w-5" />} title="Inventory looks healthy" description="No products are running low." />
          )}
        </Card>
      </div>
    </>
  );
}

function ChartSkeleton({ h = 300 }: { h?: number }) {
  return <div className="w-full animate-pulse rounded-lg bg-muted" style={{ height: h }} />;
}
