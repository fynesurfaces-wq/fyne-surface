import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';

/** Short, visible page summary that gives people and answer engines clear context. */
export function SeoAnswerSection({ heading, paragraphs, className = '', variant = 'default' }: { heading: string; paragraphs: ReactNode[]; className?: string; variant?: 'default' | 'product' | 'collection' }) {
  const content = paragraphs.filter((paragraph) => paragraph != null && paragraph !== false && paragraph !== '');
  if (!content.length) return null;

  if (variant === 'product' || variant === 'collection') {
    const isCollection = variant === 'collection';
    return (
      <section aria-label={heading} className={`w-full py-12 sm:py-16 ${className}`}>
        <div className="container">
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#e8eadf] bg-[#f7f8f3] p-6 shadow-soft sm:p-9 lg:rounded-[2.5rem] lg:p-12">
            <div aria-hidden className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-accent-300/20 blur-3xl" />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm ring-1 ring-primary/5"><Leaf className="h-5 w-5" /></span>
              <p className="text-eyebrow uppercase text-accent-700">{isCollection ? 'Collection guide' : 'Product overview'}</p>
            </div>
            <h2 className="mt-5 max-w-3xl font-serif text-3xl leading-tight tracking-tight text-primary-950 sm:text-4xl">{heading}</h2>
            <div className="mt-7 grid gap-4 text-[15px] leading-7 text-ink-soft sm:text-base sm:leading-8 md:grid-cols-2">
              {content.map((paragraph, index) => (
                <p key={index} className={`rounded-2xl border border-white/80 bg-white/85 p-5 shadow-[0_8px_24px_-22px_rgba(8,26,10,0.45)] sm:p-6 ${index === 0 ? 'md:border-l-2 md:border-l-accent-400' : ''}`}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label={heading} className={`w-full py-12 sm:py-16 ${className}`}>
      <div className="mx-auto w-full max-w-4xl px-5 sm:px-6 lg:px-10">
        <h2 className="text-display-md text-ink">{heading}</h2>
        <div className="mt-5 space-y-4 text-base leading-relaxed text-ink-soft sm:text-[17px]">
          {content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </div>
      </div>
    </section>
  );
}
