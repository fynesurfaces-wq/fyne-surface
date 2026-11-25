import type { Metadata } from 'next';
import { Mail, MapPin, Phone } from 'lucide-react';
import { getSettings } from '@/lib/api.server';
import { PageBanner } from '@/components/layout/PageBanner';
import { ContactForm } from '@/components/support/ContactForm';
import { FaqSection } from '@/components/seo/FaqSection';
import { contentPageFaqs } from '@/lib/page-faqs';

export const metadata: Metadata = { title: 'Contact FYNE SURFACES', description: 'Contact FYNE SURFACES for artificial plant orders, wholesale enquiries, green wall projects and customer support in Mumbai.', alternates: { canonical: '/contact' } };

export default async function ContactPage() {
  const settings = await getSettings();
  return <>
    <PageBanner eyebrow="We’re here to help" title="Contact FYNE SURFACES" description="Tell us about your order, artificial greenery requirements or a larger interior landscaping project." image="/images/banners/warm-modern-vertical-garden-entryway.webp" imageAlt="Modern entryway with a lush vertical garden" priority />
    <section className="container grid max-w-6xl gap-10 py-12 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
      <div><p className="text-eyebrow uppercase text-accent-700">Talk to our team</p><h2 className="mt-3 font-serif text-3xl text-ink">A greener space starts with a conversation.</h2><p className="mt-4 leading-7 text-ink-muted">Share a few details and we’ll help you find the right plants, green wall panels or wholesale options for your space.</p>
        <address className="mt-8 space-y-5 not-italic text-sm text-ink-soft">
          {settings?.contact?.phone && <a className="flex items-center gap-3 hover:text-primary" href={`tel:${settings.contact.phone.replace(/\s/g, '')}`}><Phone className="h-4 w-4 text-primary" />{settings.contact.phone}</a>}
          {settings?.contact?.email && <a className="flex items-center gap-3 hover:text-primary" href={`mailto:${settings.contact.email}`}><Mail className="h-4 w-4 text-primary" />{settings.contact.email}</a>}
          {settings?.contact?.address && <p className="flex items-start gap-3 whitespace-pre-line"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{settings.contact.address}</p>}
          {!settings?.contact?.phone && !settings?.contact?.email && !settings?.contact?.address && <p className="rounded-2xl bg-primary-50 p-5 leading-6 text-primary-900">Use the form and our team will get back to you using the contact details you provide.</p>}
        </address>
      </div>
      <ContactForm />
    </section>
    <FaqSection faqs={contentPageFaqs('contact', 'Contact FYNE SURFACES', undefined, settings)} id="contact-faqs" />
  </>;
}
