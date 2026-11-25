import { Suspense } from 'react';
import { PageBanner } from '@/components/layout/PageBanner';
import { CustomerAuthForm } from '@/components/auth/CustomerAuthForm';

export const metadata = { title: 'Create an account | FYNE SURFACES', robots: { index: false, follow: true } };
export default function RegisterPage() {
  return <><PageBanner eyebrow="A more personal experience" title="Create your account" description="Create an account to enjoy a smoother checkout and access to your order history. Email verification is not required." /><section className="container max-w-xl py-12"><Suspense><CustomerAuthForm mode="register" /></Suspense></section></>;
}
