import type { Metadata } from 'next';
import Link from 'next/link';
import { getContentPage, getSettings } from '@/lib/api.server';
import { PageBanner } from '@/components/layout/PageBanner';
import { FaqSection } from '@/components/seo/FaqSection';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 600;
export const metadata: Metadata = { title: 'Returns & Order Support | FYNE SURFACES', description: 'How to contact FYNE SURFACES about an order, damaged goods or a return request.', alternates: { canonical: '/return-policy' } };

export default async function ReturnPolicyPage() {
  const [page, settings] = await Promise.all([getContentPage('return-policy'), getSettings()]);
  const faqs = [
    { question: 'How do I request help with an order?', answer: 'Contact FYNE SURFACES with your order number, the item SKU and a clear description of the issue. The team will review the order and explain the next steps.' },
    { question: 'Should I send an item back before contacting you?', answer: 'Please contact the team first and wait for return instructions. Return eligibility, timelines and any applicable costs are confirmed after the order details are reviewed.' },
    { question: 'What if an item arrives damaged?', answer: 'Contact the team promptly with your order number and photos of the item and its packaging so the issue can be reviewed.' },
    { question: 'Can I return an item without contacting the team?', answer: 'Please contact the team first and wait for return instructions before sending anything back.' },
    { question: 'What information should I include in a return request?', answer: 'Include your order number, item SKU, reason for the request and clear photos when reporting damage or an incorrect item.' },
    { question: 'How do I report an incorrect product?', answer: 'Contact FYNE SURFACES with your order number and the item details so the team can review the order.' },
    { question: 'Are all products eligible for a return?', answer: 'Eligibility depends on the order and the circumstances. The team will confirm the applicable next steps after reviewing your request.' },
    { question: 'How long does a return review take?', answer: 'Contact the team with your order information for an update on the review.' },
    { question: 'Will I receive a refund or replacement?', answer: 'Available options depend on the specific order and issue. The team will explain the options after review.' },
    { question: 'Who pays for return shipping?', answer: 'Any applicable return shipping arrangements or costs are confirmed by the team before a return is arranged.' },
    { question: 'Can I cancel an order?', answer: 'Contact the team as soon as possible with your order number to ask whether a cancellation can still be made.' },
    { question: 'How do I contact customer care?', answer: 'Use the contact page form or the phone and email details listed there.' },
  ];
  return <>
    {page?.jsonLd && <JsonLd data={page.jsonLd} id="return-policy-jsonld" />}
    <PageBanner eyebrow="Customer care" title={page?.title || 'Returns & order support'} description={page?.excerpt || 'We want you to feel confident about your order. Contact our team so we can review your specific situation and guide you through the next step.'} image="/images/banners/lush-greenery-botanical-border.webp" imageAlt="Botanical greenery surrounding an open white center" />
    <article className="container max-w-3xl py-12 sm:py-16">
      {page?.body ? <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-ink prose-p:text-ink-soft prose-a:text-primary" dangerouslySetInnerHTML={{ __html: page.body }} /> : <div className="space-y-8">
        <aside className="rounded-2xl border border-primary-100 bg-primary-50 p-6 sm:p-8"><p className="text-eyebrow uppercase text-primary">Quick summary</p><p className="mt-3 leading-relaxed text-ink-soft">For a return, damage or order question, share your order number and item details with FYNE SURFACES before sending anything back. Return eligibility and next steps are confirmed after review.</p></aside>
        <section><h2 className="font-serif text-2xl text-ink">Requesting a return or exchange review</h2><ol className="mt-4 list-decimal space-y-3 pl-6 leading-relaxed text-ink-soft"><li>Contact our team and include your order number, item SKU and reason for your request.</li><li>For damage or an incorrect item, attach clear photos of the product and packaging.</li><li>Wait for the team to confirm eligibility and provide instructions before dispatching an item.</li></ol></section>
        <section><h2 className="font-serif text-2xl text-ink">Refunds, replacements and delivery issues</h2><p className="mt-4 leading-relaxed text-ink-soft">Available options depend on the order and the issue reported. The team will confirm any applicable return shipping, refund or replacement details with you before a return is arranged.</p></section>
        <section className="rounded-2xl border border-line p-6 sm:p-8"><h2 className="font-serif text-2xl text-ink">Need help with an order?</h2><p className="mt-3 text-ink-muted">Contact us with your order number and we’ll guide you through the review.</p><Link href="/contact" className="mt-5 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Contact FYNE SURFACES</Link>{settings?.contact?.email && <p className="mt-4 text-sm text-ink-muted">Or email <a className="text-primary underline" href={`mailto:${settings.contact.email}`}>{settings.contact.email}</a>.</p>}</section>
      </div>}
    </article>
    <FaqSection faqs={faqs} id="return-policy-faq" />
  </>;
}
