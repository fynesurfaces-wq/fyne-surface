import { JsonLd } from '@/components/seo/JsonLd';
import { TextReveal } from '@/components/ui/Motion';

export type Faq = { question: string; answer: string };

export function faqSchemaNode(faqs: Faq[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function FaqSection({ faqs, id = 'frequently-asked-questions', includeJsonLd = true, showHeading = true }: { faqs: Faq[]; id?: string; includeJsonLd?: boolean; showHeading?: boolean }) {
  const items = faqs.slice(0, 12);
  if (!items.length) return null;
  const columns = [items.slice(0, 6), items.slice(6, 12)];

  return (
    <section aria-labelledby={showHeading ? `${id}-heading` : undefined} aria-label={!showHeading ? 'Frequently asked questions' : undefined} className="container py-16 lg:py-24">
      {includeJsonLd && <JsonLd id={`${id}-jsonld`} data={{ '@context': 'https://schema.org', ...faqSchemaNode(items) }} />}
      {showHeading && <div className="mb-10 max-w-2xl lg:mb-12">
        <p className="text-eyebrow uppercase tracking-[0.18em] text-primary">Helpful answers <span className="ml-2 inline-block size-2 rounded-full bg-accent align-middle" aria-hidden="true" /></p>
        <TextReveal as="h2" id={`${id}-heading`} className="mt-3 text-display-md text-ink">Frequently asked questions</TextReveal>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-soft">Find the details you need to choose with confidence.</p>
      </div>}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="grid content-start gap-3">
            {column.map((faq, index) => (
              <details key={faq.question} className="faq-item group rounded-2xl border border-line/80 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(31,54,42,0.035)] transition-[border-color,background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_12px_30px_rgba(31,54,42,0.08)] open:border-primary/20 open:bg-[#F2F8F1] sm:px-6 sm:py-5" open={columnIndex === 0 && index === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold leading-snug text-ink marker:hidden transition-colors duration-200 hover:text-primary [&::-webkit-details-marker]:hidden">
                  <span>{faq.question}</span>
                  <span className="faq-toggle flex size-8 shrink-0 items-center justify-center rounded-full border border-accent/60 bg-accent-50 text-lg font-normal leading-none text-primary transition-all duration-300 group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-white" aria-hidden="true">+</span>
                </summary>
                <p className="faq-answer mt-4 border-t border-line/70 pt-4 pr-2 text-[15px] leading-7 text-ink-soft">{faq.answer}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
