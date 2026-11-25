import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';
import { CustomerOrderDetails } from '@/components/account/CustomerOrderDetails';

export const metadata: Metadata = { title: 'Track your order', robots: { index: false, follow: false } };
export default function OrderDetailPage({ params }: { params: { id: string } }) { return <><PageBanner eyebrow="Customer account" title="Track your order" description="See your order status, delivery progress and order details." /><CustomerOrderDetails orderId={params.id} /></>; }
