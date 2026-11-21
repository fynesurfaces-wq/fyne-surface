import { jsonLdString } from '@/lib/utils';

/**
 * Server-rendered <script type="application/ld+json">. The payload is built by
 * the backend (utils/seo/jsonLd.js) so the storefront, sitemap, product feed
 * and llms.txt all describe products identically.
 */
export function JsonLd({ data, id }: { data: unknown; id?: string }) {
  if (!data) return null;
  return <script type="application/ld+json" id={id} dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
