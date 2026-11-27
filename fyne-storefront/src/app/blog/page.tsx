import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import { getBlogPosts } from '@/lib/api.server';
import { PageBanner } from '@/components/layout/PageBanner';
import { PlantImage } from '@/components/ui/PlantImage';
import { FaqSection } from '@/components/seo/FaqSection';
import { journalFaqs } from '@/lib/page-faqs';

export const revalidate = 300;
export const metadata: Metadata = {
  title: 'The FYNE Journal | Artificial Plant Guides & Ideas',
  description: 'Ideas, care guides and practical inspiration for artificial plants, green walls and considered interiors.',
  alternates: { canonical: '/blog' },
};

export default async function BlogIndexPage() {
  const { data: posts } = await getBlogPosts({ limit: 24 });
  return (
    <>
      <PageBanner eyebrow="The FYNE Journal" title="Ideas for greener spaces" description="Practical guides and inspiration for artificial plants, vertical gardens and interiors." image={posts.find((post) => post.coverImage?.url)?.coverImage?.url || '/images/banners/lush-hanging-greenery-banner.webp'} imageAlt="Hanging greenery framing a bright open space" priority />
      <section className="container py-14 sm:py-20" aria-label="Latest articles">
        {posts.length ? (
          <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post._id} className="group min-w-0">
                <Link href={`/blog/${post.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand">
                    <PlantImage src={post.coverImage?.url} alt={post.coverImage?.alt || post.title} seed={post.slug} sizes="(min-width: 1024px) 33vw, 100vw" className="transition-transform duration-700 group-hover:scale-105" unoptimized={post.coverImage?.unoptimized} />
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-ink-muted">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'FYNE Journal'}
                  </div>
                  <h2 className="mt-3 font-serif text-2xl leading-tight text-ink group-hover:text-primary">{post.title}</h2>
                  {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-muted">{post.excerpt}</p>}
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-line bg-canvas px-6 py-16 text-center">
            <h2 className="font-serif text-2xl text-ink">Articles are on the way</h2>
            <p className="mx-auto mt-3 max-w-xl text-ink-muted">The journal will show published guides and stories here. Browse the collections while we prepare the first articles.</p>
            <Link href="/collections" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">Explore collections</Link>
          </div>
        )}
      </section>
      <FaqSection faqs={journalFaqs()} id="journal-faqs" />
    </>
  );
}
