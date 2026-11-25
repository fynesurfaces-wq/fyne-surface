import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';
import { CustomerOrderDetails } from '@/components/account/CustomerOrderDetails';

export const metadata: Metadata = { title: 'Order placed', robots: { index: false, follow: false } };
export default function OrderSuccessPage({ params }: { params: { id: string } }) { return <><PageBanner eyebrow="Order confirmation" title="Your order is placed" description="Your Cash on Delivery order has been received. Keep this page to follow its progress." /><CustomerOrderDetails orderId={params.id} success /></>; }
