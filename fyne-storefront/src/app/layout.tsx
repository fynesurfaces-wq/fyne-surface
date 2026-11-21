import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import { getCollections, getSettings } from '@/lib/api.server';
import { SITE_URL } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MotionProvider } from '@/components/ui/Motion';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageViewTracker } from '@/components/layout/PageViewTracker';
import { CartHydrator } from '@/store/CartHydrator';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s?.storeName || 'FYNE SURFACES';
  const title = s?.seo?.defaultMetaTitle || `${name} | Premium Artificial Plants & Vertical Gardens`;
  const description =
    s?.seo?.defaultMetaDescription ||
    'Lifelike artificial trees, plants and bush packs for homes, offices and hospitality. Zero maintenance greenery by FYNE SURFACES — Premium Vertical Garden.';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    // No site-wide canonical here — each page sets its own (a layout canonical would leak to every route).
    openGraph: { type: 'website', siteName: name, locale: 'en_IN', title, description },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 } },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: '#2E7D32', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, collections] = await Promise.all([getSettings(), getCollections()]);

  return (
    <html lang="en-IN">
      <body className="flex min-h-screen flex-col">
        {/* Organization + WebSite (sitelinks search box) */}
        {settings && <JsonLd data={settings.organizationJsonLd} id="org-jsonld" />}
        <JsonLd
          id="website-jsonld"
          data={{
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: settings?.storeName || 'FYNE SURFACES',
            url: SITE_URL,
            potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
          }}
        />
        <MotionProvider>
          <Navbar collections={collections} />
          <main id="main" className="flex-1">{children}</main>
          <Footer settings={settings} collections={collections} />
          <CartDrawer />
        </MotionProvider>
        <CartHydrator />
        <PageViewTracker />
      </body>
    </html>
  );
}
