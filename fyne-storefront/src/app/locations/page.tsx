import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { METRO_CITIES } from '@/lib/locations';
import { PageBanner } from '@/components/layout/PageBanner';
import { FaqSection } from '@/components/seo/FaqSection';
import { locationIndexFaqs } from '@/lib/page-faqs';

export const metadata: Metadata = {
  title: 'Artificial Plants by City | FYNE SURFACES',
  description: 'Explore city guides for artificial plants and vertical garden products across 50 major Indian cities.',
  alternates: { canonical: '/locations' },
};

export default function LocationsIndexPage() {
  return <>
    <PageBanner eyebrow="Shop by location" title="Explore FYNE by city" description="Browse artificial plants and vertical garden products with guides for 50 major Indian cities." image="/images/banners/airy-botanical-foliage-banner.webp" imageAlt="Airy botanical foliage framing a light open space" priority />
    <section className="container py-12 sm:py-16">
      <div className="mx-auto mb-12 max-w-3xl text-center"><p className="text-eyebrow uppercase text-accent-700">A local guide to the catalogue</p><h2 className="mt-3 font-serif text-3xl text-ink">Find artificial greenery for your city</h2><p className="mt-4 leading-7 text-ink-muted">Choose a city to see shopping guidance, browse current products and check the delivery total for your address at checkout. The live catalogue shows product specifications, prices and availability.</p></div>
      <div className="mb-10 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl bg-primary-50 p-5"><p className="font-semibold text-primary-900">Browse by city</p><p className="mt-2 text-sm leading-6 text-ink-soft">Open a city guide for relevant product ideas and ordering information.</p></div><div className="rounded-2xl bg-accent-50 p-5"><p className="font-semibold text-ink">Compare the details</p><p className="mt-2 text-sm leading-6 text-ink-soft">Review sizes, descriptions, stock and current listed prices on product pages.</p></div><div className="rounded-2xl bg-canvas p-5"><p className="font-semibold text-ink">Check your delivery</p><p className="mt-2 text-sm leading-6 text-ink-soft">Enter your address during checkout to see the server-calculated shipping and total.</p></div></div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {METRO_CITIES.map(({ slug, city, state }) => <li key={slug}><Link href={`/locations/${slug}`} className="group flex items-center justify-between rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-soft"><span className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary"><MapPin className="h-4 w-4" /></span><span><span className="block font-semibold text-ink">{city}</span><span className="mt-0.5 block text-xs text-ink-muted">{state}</span></span></span><ArrowRight className="h-4 w-4 text-ink-faint transition group-hover:translate-x-1 group-hover:text-primary" /></Link></li>)}
      </ul>
    </section>
    <FaqSection faqs={locationIndexFaqs()} id="locations-faq" />
  </>;
}
