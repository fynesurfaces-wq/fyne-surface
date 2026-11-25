import { cn } from '@/lib/utils';
import type { OrderStatus, PaymentStatus, Role } from '@/lib/types';
import { ROLE_LABEL } from '@/lib/access';

type Tone = 'green' | 'orange' | 'red' | 'gray' | 'blue' | 'purple';

const tones: Record<Tone, string> = {
  green: 'bg-primary-50 text-primary-700 ring-primary-200',
  orange: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
  red: 'bg-danger-50 text-danger ring-red-200',
  gray: 'bg-muted text-ink-soft ring-gray-200',
  blue: 'bg-info-50 text-info ring-blue-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
};

export function Badge({ tone = 'gray', dot, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const ORDER_TONE: Record<OrderStatus, Tone> = { Pending: 'orange', Processing: 'purple', Shipped: 'blue', Delivered: 'green', Cancelled: 'gray' };
const PAYMENT_TONE: Record<PaymentStatus, Tone> = { Pending: 'orange', Paid: 'green', Failed: 'red', Refunded: 'gray' };
const ROLE_TONE: Record<Role, Tone> = { superadmin: 'purple', admin: 'green', editor: 'blue' };

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => <Badge tone={ORDER_TONE[status]} dot>{status}</Badge>;
export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => <Badge tone={PAYMENT_TONE[status]} dot>{status}</Badge>;
export const RoleBadge = ({ role }: { role: Role }) => <Badge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Badge>;
export const ActiveBadge = ({ active }: { active: boolean }) => <Badge tone={active ? 'green' : 'gray'} dot>{active ? 'Active' : 'Draft'}</Badge>;

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  Pending: '#F57C00',
  Processing: '#7C3AED',
  Shipped: '#2563EB',
  Delivered: '#2E7D32',
  Cancelled: '#9CA3AF',
};
