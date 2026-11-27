import type { Breadcrumb, StoreImage } from '@/lib/types';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { PlantImage } from '@/components/ui/PlantImage';
import { TextReveal } from '@/components/ui/Motion';

/** Collection banner: H1 + description over the cover image (or botanical art). */
export function CollectionHero({ title, descriptionHtml, cover, count, breadcrumbs, seed }: { title: string; descriptionHtml?: string; cover?: StoreImage | null; count: number; breadcrumbs: Breadcrumb[]; seed: string }) {
  const heading = title.trim().toLowerCase().startsWith('artificial') ? title.trim() : `Artificial ${title.trim()}`;
  return (
    <section className="container pt-6 lg:pt-8">
      <div className="relative isolate overflow-hidden rounded-[2rem] bg-primary-900">
        <div className="absolute inset-0 -z-10 opacity-75">
          <PlantImage src={cover?.url} alt={cover?.alt || `${title} collection`} seed={seed} priority sizes="100vw" unoptimized={cover?.unoptimized} />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary-950/85 via-primary-950/48 to-primary-950/5" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-950/30 via-transparent to-white/5" />
        <div className="px-7 py-14 sm:px-12 lg:px-16 lg:py-24">
          <Breadcrumbs items={breadcrumbs} inverted className="mb-8" />
          <p className="text-eyebrow uppercase text-accent-300">{count} {count === 1 ? 'product' : 'products'}</p>
          <TextReveal as="h1" className="mt-4 max-w-3xl text-display-lg text-white">{heading} in Mumbai</TextReveal>
          {descriptionHtml && (
            <div className="prose prose-lg mt-6 max-w-2xl prose-p:text-white/80 prose-strong:text-white prose-a:text-white" dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
          )}
        </div>
      </div>
    </section>
  );
}
