import type { ReactNode } from 'react';

/** Short, visible page summary that gives people and answer engines clear context. */
export function SeoAnswerSection({ heading, paragraphs, className = '' }: { heading: string; paragraphs: ReactNode[]; className?: string }) {
  const content = paragraphs.filter((paragraph) => paragraph != null && paragraph !== false && paragraph !== '');
  if (!content.length) return null;

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
