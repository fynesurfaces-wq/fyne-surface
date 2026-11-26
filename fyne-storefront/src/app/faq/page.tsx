import type { Metadata } from 'next';
import { PageBanner } from '@/components/layout/PageBanner';
import { FaqSection } from '@/components/seo/FaqSection';
import { homeFaqs } from '@/lib/page-faqs';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | FYNE SURFACES',
  description: 'Answers about artificial plants, product details, ordering and support from FYNE SURFACES.',
  alternates: { canonical: '/faq' },
};

export default function FaqPage() {
  return <><PageBanner eyebrow="Helpful answers" title="Frequently asked questions" description="Quick answers about choosing artificial plants, product details and getting help with an order." /><FaqSection faqs={homeFaqs([])} id="faq-page" showHeading={false} /></>;
}
