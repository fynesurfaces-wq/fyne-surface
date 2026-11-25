import { Suspense } from 'react';
import { PageBanner } from '@/components/layout/PageBanner';
import { VerifyEmail } from '@/components/auth/VerifyEmail';

export const metadata = { title: 'Verify email | FYNE SURFACES', robots: { index: false, follow: false } };
export default function VerifyEmailPage() {
  return <><PageBanner eyebrow="Account verification" title="Confirm your email" description="We’re checking your secure verification link." /><section className="container max-w-xl py-12"><Suspense><VerifyEmail /></Suspense></section></>;
}
