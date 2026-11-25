import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';
import { CustomerOrders } from '@/components/account/CustomerOrders';

export const metadata: Metadata = { title: 'Your orders', robots: { index: false, follow: false } };
export default function OrdersPage() { return <><PageBanner eyebrow="Customer account" title="Your orders" description="Review past purchases and follow your deliveries." /><section className="container max-w-4xl py-10 sm:py-14"><CustomerOrders /></section></>; }
