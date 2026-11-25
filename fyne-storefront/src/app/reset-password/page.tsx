import { Suspense } from 'react';
import { PageBanner } from '@/components/layout/PageBanner';
import { PasswordRecoveryForm } from '@/components/auth/PasswordRecoveryForm';

export const metadata = { title: 'Choose a new password | FYNE SURFACES', robots: { index: false, follow: false } };
export default function ResetPasswordPage() { return <><PageBanner eyebrow="Account access" title="Choose a new password" description="Reset links expire after one hour. You can request another link from the sign-in page if needed." /><section className="container max-w-xl py-12"><Suspense><PasswordRecoveryForm mode="reset" /></Suspense></section></>; }
