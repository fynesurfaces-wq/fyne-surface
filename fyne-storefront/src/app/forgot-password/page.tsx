import { Suspense } from 'react';
import { PageBanner } from '@/components/layout/PageBanner';
import { PasswordRecoveryForm } from '@/components/auth/PasswordRecoveryForm';

export const metadata = { title: 'Forgot password | FYNE SURFACES', robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <><PageBanner eyebrow="Account access" title="Reset your password" description="Enter the email address linked to your account and we’ll send a secure reset link if it exists." /><section className="container max-w-xl py-12"><Suspense><PasswordRecoveryForm mode="forgot" /></Suspense></section></>; }
