import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import { getBlogPost } from '@/lib/api.server';
import { toPath } from '@/lib/utils';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageBanner } from '@/components/layout/PageBanner';
import { PlantImage } from '@/components/ui/PlantImage';
import { FaqSection } from '@/components/seo/FaqSection';
import { journalFaqs } from '@/lib/page-faqs';

type Props = { params: { slug: string } };
export const revalidate = 300;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  if (!post) return { title: 'Article not found', robots: { index: false } };
  return {
    title: { absolute: post.seo?.title || post.title },
    description: post.seo?.description || post.excerpt,
    alternates: { canonical: toPath(post.seo?.canonicalUrl || post.url) },
    openGraph: { type: 'article', title: post.seo?.title || post.title, description: post.seo?.description || post.excerpt, images: post.coverImage?.url ? [{ url: post.coverImage.url, alt: post.coverImage.alt || post.title }] : undefined, publishedTime: post.publishedAt },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getBlogPost(params.slug);
  if (!post) notFound();
  const author = typeof post.author === 'object' ? post.author?.name : post.author;
  return (
    <>
      {post.jsonLd && <JsonLd data={post.jsonLd} id="blog-post-jsonld" />}
      <PageBanner eyebrow="The FYNE Journal" title={post.title} description={post.excerpt} image={post.coverImage?.url || '/images/banners/lush-greenery-botanical-border.webp'} imageAlt={post.coverImage?.alt || post.title} />
      <article className="container max-w-3xl pb-24 pt-10 sm:pt-14">
        <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
          {post.publishedAt && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />{new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          {author && <span>By {author}</span>}
        </div>
        {post.coverImage?.url && <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-3xl bg-sand"><PlantImage src={post.coverImage.url} alt={post.coverImage.alt || post.title} seed={post.slug} sizes="(min-width: 768px) 768px, 100vw" unoptimized={post.coverImage.unoptimized} /></div>}
        <aside className="mb-10 rounded-2xl border border-primary-100 bg-primary-50 p-6 sm:p-7" aria-label="Quick summary">
          <p className="text-eyebrow uppercase text-primary">Quick summary</p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{post.excerpt || post.seo?.description}</p>
        </aside>
        {post.tags?.length ? <ul className="mb-8 flex flex-wrap gap-2" aria-label="Article topics">{post.tags.map((tag) => <li key={tag} className="rounded-full bg-canvas px-3 py-1 text-xs text-ink-muted">{tag}</li>)}</ul> : null}
        <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-ink prose-p:text-ink-soft prose-a:text-primary" dangerouslySetInnerHTML={{ __html: post.body || '' }} />
        <Link href="/blog" className="mt-12 inline-flex font-semibold text-primary hover:underline">← Back to the journal</Link>
      </article>
      <FaqSection faqs={journalFaqs(post.title)} id="journal-article-faqs" includeJsonLd={false} />
    </>
  );
}
