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

export function FaqSection({ faqs, id = 'frequently-asked-questions', includeJsonLd = true }: { faqs: Faq[]; id?: string; includeJsonLd?: boolean }) {
  const items = faqs.slice(0, 12);
  if (!items.length) return null;
  const columns = [items.slice(0, 6), items.slice(6, 12)];

  return (
    <section aria-labelledby={`${id}-heading`} className="container py-20 lg:py-28">
      {includeJsonLd && <JsonLd id={`${id}-jsonld`} data={{ '@context': 'https://schema.org', ...faqSchemaNode(items) }} />}
      <div className="mb-10 max-w-2xl">
        <p className="text-eyebrow uppercase text-accent">Helpful answers</p>
        <TextReveal as="h2" id={`${id}-heading`} className="mt-3 text-display-md text-ink">Frequently asked questions</TextReveal>
      </div>
      <div className="grid gap-x-12 lg:grid-cols-2">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className="divide-y divide-line border-t border-line">
            {column.map((faq, index) => (
              <details key={faq.question} className="faq-item group py-5" open={columnIndex === 0 && index === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-[15px] font-semibold text-ink transition-colors duration-300 marker:hidden hover:text-primary">
                  <span>{faq.question}</span>
                  <span className="mt-0.5 text-lg leading-none text-ink-muted transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="faq-answer mt-3 pr-6 text-[15px] leading-relaxed text-ink-soft">{faq.answer}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
