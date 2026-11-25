import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { LegacySiteContent } from '@/lib/types';
import { PlantImage } from '@/components/ui/PlantImage';

export function LegacyCTA({ content }: { content: LegacySiteContent | null }) {
  if (!content?.isEnabled) return null;
  return (
    <section className="container py-16 sm:py-20 lg:py-24" aria-label="Legacy and events">
      <div className="relative isolate grid min-h-[360px] overflow-hidden rounded-[2rem] bg-primary-950 lg:grid-cols-2">
        {content.image?.url && <div className="absolute inset-0 -z-10 opacity-35"><PlantImage src={content.image.url} alt={content.image.alt || ''} seed="legacy-event" sizes="100vw" /></div>}
        <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
          <p className="text-eyebrow uppercase text-accent-300">{content.eyebrow}</p>
          <h2 className="mt-4 max-w-2xl font-serif text-display-md text-white">{content.title}</h2>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-white/75">{content.body}</p>
          <Link href={content.ctaHref} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-ink transition hover:bg-accent-500">
            {content.ctaLabel}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="hidden lg:block" />
      </div>
    </section>
  );
}
