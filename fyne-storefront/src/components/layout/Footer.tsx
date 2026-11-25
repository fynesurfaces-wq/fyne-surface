import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';
import type { CollectionSummary, StoreSettings } from '@/lib/types';
import { Logo } from '@/components/ui/Logo';
import { Newsletter } from './Newsletter';
import { SOCIAL_LABELS, SocialIcon } from './SocialIcons';

export function Footer({ settings, collections }: { settings: StoreSettings | null; collections: CollectionSummary[] }) {
  const socials = [
    ...Object.entries(settings?.social || {}).filter(([key, value]) => value && SOCIAL_LABELS[key] && key !== 'instagram'),
    ['instagram', 'https://www.instagram.com/fynesurfaces'],
  ] as [string, string][];
  const year = new Date().getFullYear();

  return (
    <footer className="bg-primary-950 text-white/70" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">Footer</h2>

      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="container grid gap-10 py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-eyebrow uppercase text-accent-300">The FYNE Journal</p>
            <p className="mt-4 max-w-md text-display-md text-white">Ideas for greener interiors, delivered.</p>
          </div>
          <Newsletter />
        </div>
      </div>

      <div className="container grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo inverted />
          <p className="mt-6 max-w-xs text-sm leading-relaxed">
            {settings?.tagline || 'Premium Vertical Garden'} — lifelike artificial trees, plants and bush packs that stay green all year, with zero maintenance.
          </p>
          <Link href="/collections" className="mt-4 inline-flex text-sm font-medium text-white underline decoration-white/40 underline-offset-4 transition hover:text-accent-300">
            Shop artificial plants in Mumbai
          </Link>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-300">Natural spaces. Better living.</p>
          {socials.length > 0 && (
            <ul className="mt-8 flex gap-3">
              {socials.map(([key, url]) => (
                <li key={key}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LABELS[key]} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white/80 transition hover:border-white hover:bg-white hover:text-primary-900">
                    <SocialIcon name={key} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Collections" className="lg:col-span-3">
          <h3 className="text-sm font-semibold text-white">Shop</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {collections.map((c) => (
              <li key={c.id}><Link href={`/collections/${c.slug}`} className="transition hover:text-orange-300">{c.name}</Link></li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company" className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-white">Company</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link href="/pages/about" className="transition hover:text-orange-300">About</Link></li>
            <li><Link href="/contact" className="transition hover:text-orange-300">Contact</Link></li>
            <li><Link href="/blog" className="transition hover:text-orange-300">Blog</Link></li>
            <li><Link href="/locations" className="transition hover:text-orange-300">Locations</Link></li>
            <li><Link href="/pages/shipping-policy" className="transition hover:text-orange-300">Shipping Policy</Link></li>
            <li><Link href="/return-policy" className="transition hover:text-orange-300">Return Policy</Link></li>
            <li><Link href="/privacy-policy" className="transition hover:text-orange-300">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" className="transition hover:text-orange-300">Terms & Conditions</Link></li>
          </ul>
        </nav>

        <address className="not-italic lg:col-span-3">
          <h3 className="text-sm font-semibold text-white">Get in touch</h3>
          <p className="mt-3 text-xs leading-relaxed text-white/55">Mumbai region: Malad West, Andheri, Bandra, Goregaon, Powai, Borivali, Thane and Navi Mumbai.</p>
          <ul className="mt-5 space-y-3 text-sm">
            {settings?.contact?.email && (
              <li className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" /><a href={`mailto:${settings.contact.email}`} className="hover:text-white">{settings.contact.email}</a></li>
            )}
            {settings?.contact?.phone && (
              <li className="flex items-start gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" /><a href={`tel:${settings.contact.phone.replace(/\s/g, '')}`} className="hover:text-white">{settings.contact.phone}</a></li>
            )}
            {settings?.contact?.address && (
              <li className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-300" /><span className="whitespace-pre-line">{settings.contact.address}</span></li>
            )}
            {!settings?.contact?.email && !settings?.contact?.phone && (
              <li><Link href="/contact" className="hover:text-white">Contact our team →</Link></li>
            )}
          </ul>
        </address>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-3 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {settings?.storeName || 'FYNE SURFACES'}. All rights reserved.</p>
          <p>
            <a
              href="https://mydigitalcrown.in/search-engine-optimisation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-300"
            >
              SEO Company in Mumbai
            </a>
          </p>
          <p>Prices in INR {settings?.tax?.pricesIncludeTax === false ? '(excl. GST)' : '(incl. GST)'}</p>
        </div>
      </div>
    </footer>
  );
}
