import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/lora';
import './globals.css';
import { getCollections, getSettings } from '@/lib/api.server';
import { SITE_URL } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { MotionProvider } from '@/components/ui/Motion';
import { JsonLd } from '@/components/seo/JsonLd';
import { PageViewTracker } from '@/components/layout/PageViewTracker';
import { ContactActions } from '@/components/layout/ContactActions';
import { CartHydrator } from '@/store/CartHydrator';
import { CustomerAuthProvider } from '@/components/auth/CustomerAuthProvider';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s?.storeName || 'FYNE SURFACES';
  const title = s?.seo?.defaultMetaTitle || `${name} | Premium Artificial Plants & Vertical Gardens`;
  const description =
    s?.seo?.defaultMetaDescription ||
    'Shop artificial plants in Mumbai, including lifelike trees, plants and bush packs for homes, offices and hospitality spaces.';
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    verification: { google: 'ZgOji4ClrKfRc9LWgjipPav8P1-7_6ffFQY2WqE1Z4s' },
    // No site-wide canonical here — each page sets its own (a layout canonical would leak to every route).
    openGraph: { type: 'website', siteName: name, locale: 'en_IN', title, description },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large', 'max-snippet': -1 } },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = { themeColor: '#3F863F', width: 'device-width', initialScale: 1 };

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
          <CustomerAuthProvider>
            <Navbar collections={collections} />
            <main id="main" className="flex-1">{children}</main>
            <Footer settings={settings} collections={collections} />
            <CartDrawer />
            <ContactActions phone={settings?.contact?.phone} whatsapp={settings?.contact?.whatsapp} />
          </CustomerAuthProvider>
        </MotionProvider>
        <CartHydrator />
        <PageViewTracker />
      </body>
    </html>
  );
}
