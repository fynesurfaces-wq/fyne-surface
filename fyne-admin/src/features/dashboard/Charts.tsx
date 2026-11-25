'use client';

import {
  Area,
  ComposedChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ORDER_STATUS_COLORS } from '@/components/ui/Badge';
import { formatINR, formatINRCompact } from '@/lib/utils';
import type { DashboardData, OrderStatus } from '@/lib/types';

const GREEN = '#2E7D32';
const ORANGE = '#F57C00';

const shortDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Revenue (green area) + orders (orange line) per day. */
export function SalesChart({ data }: { data: NonNullable<DashboardData['salesOverTime']> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
            <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#EEF0F2" vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} minTickGap={24} />
        <YAxis yAxisId="rev" tickFormatter={(v) => formatINRCompact(v)} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={64} />
        <YAxis yAxisId="ord" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={32} />
        <Tooltip
          cursor={{ stroke: '#D1D5DB', strokeDasharray: 4 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs shadow-pop">
                <p className="mb-1.5 font-semibold text-ink">{shortDate(String(label))}</p>
                <p className="flex items-center gap-2 text-ink-soft"><span className="h-2 w-2 rounded-full bg-primary" />Revenue <b className="ml-auto pl-4 text-ink">{formatINR(Number(payload[0]?.value))}</b></p>
                <p className="mt-1 flex items-center gap-2 text-ink-soft"><span className="h-2 w-2 rounded-full bg-secondary" />Orders <b className="ml-auto pl-4 text-ink">{payload[1]?.value}</b></p>
              </div>
            ) : null
          }
        />
        <Legend verticalAlign="top" align="right" height={28} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke={GREEN} strokeWidth={2.5} fill="url(#rev)" activeDot={{ r: 5 }} />
        <Line yAxisId="ord" type="monotone" dataKey="orders" name="Orders" stroke={ORANGE} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

/** Donut of order statuses with the total in the middle. */
export function OrderStatusPie({ data }: { data: Partial<Record<OrderStatus, number>> }) {
  const rows = (['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]).map((s) => ({ name: s, value: data[s] || 0 }));
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (!total) {
    return <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">No orders in this period</div>;
  }
  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie data={rows.filter((r) => r.value)} dataKey="value" nameKey="name" innerRadius={62} outerRadius={90} paddingAngle={2} stroke="none">
              {rows.filter((r) => r.value).map((r) => <Cell key={r.name} fill={ORDER_STATUS_COLORS[r.name as OrderStatus]} />)}
            </Pie>
            <Tooltip formatter={(v: number, n: string) => [`${v} order${v === 1 ? '' : 's'}`, n]} contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold text-ink tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">orders</span>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: ORDER_STATUS_COLORS[r.name as OrderStatus] }} />
            <span className="text-ink-soft">{r.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-ink">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
