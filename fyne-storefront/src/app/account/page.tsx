import { PageBanner } from '@/components/layout/PageBanner';
import { AccountProfile } from '@/components/account/AccountProfile';
import Link from 'next/link';

export const metadata = { title: 'Your account | FYNE SURFACES', robots: { index: false, follow: false } };
export default function AccountPage() { return <><PageBanner eyebrow="Customer account" title="Your account" description="Manage your profile, saved details and orders." /><section className="container max-w-2xl py-12"><div className="mb-8 flex flex-wrap gap-3"><Link href="/account/orders" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">View all orders</Link></div><AccountProfile /></section></>; }
