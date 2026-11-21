import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Mail, MapPin, Phone } from 'lucide-react';
import { getContentPage, getSettings } from '@/lib/api.server';
import { toPath } from '@/lib/utils';
import { JsonLd } from '@/components/seo/JsonLd';
import { ButtonLink } from '@/components/ui/Button';

export const revalidate = 600;

/**
 * CMS pages (About, Contact, Shipping Policy…) authored in Admin → Content → Pages.
 * Until a page is published there, the core pages show a minimal holding view
 * (noindex) instead of a 404 — policy text is never invented here.
 */
const CORE: Record<string, string> = { about: 'About FYNE SURFACES', contact: 'Contact us', 'shipping-policy': 'Shipping Policy' };

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getContentPage(params.slug);
  if (page) return { title: { absolute: page.seo.title }, description: page.seo.description, alternates: { canonical: toPath(page.seo.canonicalUrl) } };
  if (CORE[params.slug]) return { title: CORE[params.slug], robots: { index: false, follow: true } };
  return { title: 'Page not found', robots: { index: false } };
}

export default async function ContentPageRoute({ params }: Props) {
  const [page, settings] = await Promise.all([getContentPage(params.slug), getSettings()]);
  if (!page && !CORE[params.slug]) notFound();
  const c = settings?.contact;

  return (
    <article className="container max-w-3xl pb-28 pt-12 lg:pt-20">
      {page && <JsonLd data={page.jsonLd} />}
      <h1 className="text-display-lg text-ink">{page?.title || CORE[params.slug]}</h1>

      {page?.body ? (
        <div className="prose prose-lg mt-10 max-w-none prose-headings:tracking-tight prose-headings:text-ink prose-p:text-ink-soft prose-a:text-primary" dangerouslySetInnerHTML={{ __html: page.body }} />
      ) : (
        <div className="mt-8 space-y-8">
          <p className="text-lg leading-relaxed text-ink-muted">
            {params.slug === 'contact' ? 'We’d love to hear about your space. Reach our team directly:' : 'This page is being prepared. For any questions, please get in touch with our team.'}
          </p>
          {(c?.email || c?.phone || c?.address) && (
            <ul className="space-y-4 rounded-3xl bg-canvas p-8 text-[15px] text-ink-soft">
              {c?.email && <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /><a className="hover:text-primary" href={`mailto:${c.email}`}>{c.email}</a></li>}
              {c?.phone && <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /><a className="hover:text-primary" href={`tel:${c.phone.replace(/\s/g, '')}`}>{c.phone}</a></li>}
              {c?.address && <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 text-primary" />{c.address}</li>}
            </ul>
          )}
          <ButtonLink href="/collections" variant="outline">Browse collections</ButtonLink>
        </div>
      )}
    </article>
  );
}
