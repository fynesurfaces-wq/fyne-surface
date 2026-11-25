import { Suspense } from 'react';
import { PageBanner } from '@/components/layout/PageBanner';
import { CustomerAuthForm } from '@/components/auth/CustomerAuthForm';

export const metadata = { title: 'Sign in | FYNE SURFACES', robots: { index: false, follow: true } };
export default function LoginPage() {
  return <><PageBanner eyebrow="Your account" title="Welcome back" description="Sign in to continue securely. Your cart is saved while you browse." /><section className="container max-w-xl py-12"><Suspense><CustomerAuthForm mode="login" /></Suspense></section></>;
}
