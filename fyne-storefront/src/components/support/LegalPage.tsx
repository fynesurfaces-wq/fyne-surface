import type { ReactNode } from 'react';
import { PageBanner } from '@/components/layout/PageBanner';
import { FaqSection } from '@/components/seo/FaqSection';
import type { Faq } from '@/components/seo/FaqSection';

export type LegalSection = { title: string; body: ReactNode };

export function LegalPage({ eyebrow, title, description, sections, image, faqs }: { eyebrow: string; title: string; description: string; sections: LegalSection[]; image?: string; faqs: Faq[] }) {
  return <>
    <PageBanner eyebrow={eyebrow} title={title} description={description} image={image} imageAlt={title} />
    <article className="container max-w-3xl space-y-9 py-12 sm:py-16">
      <p className="text-sm leading-7 text-ink-muted">This page explains how FYNE SURFACES handles information and orders through this website. For questions about a specific order or request, please <a className="font-semibold text-primary underline underline-offset-4" href="/contact">contact our team</a>.</p>
      {sections.map((section) => <section key={section.title}><h2 className="font-serif text-2xl text-ink">{section.title}</h2><div className="mt-3 space-y-3 leading-7 text-ink-soft">{section.body}</div></section>)}
    </article>
    <FaqSection faqs={faqs} id={`${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-faqs`} />
  </>;
}
