import type { Metadata } from 'next';
import { LegalPage } from '@/components/support/LegalPage';
import { policyFaqs } from '@/lib/page-faqs';

export const metadata: Metadata = { title: 'Terms and Conditions', description: 'Read the terms for browsing, ordering artificial plants, Cash on Delivery and using the FYNE SURFACES website.', alternates: { canonical: '/terms-and-conditions' } };

export default function TermsPage() {
  return <LegalPage eyebrow="Store information" title="Terms and Conditions" description="The terms that apply when you use this website and place an order with FYNE SURFACES." image="/images/banners/lush-greenery-frame-with-soft-shadows.webp" faqs={policyFaqs('terms')} sections={[
    { title: 'Using the website', body: <p>Use the website lawfully and provide accurate information when creating an account, requesting support or placing an order. Keep your account sign-in details secure and let us know if you believe your account has been accessed without permission.</p> },
    { title: 'Products, prices and availability', body: <p>Product images and descriptions are provided to help you choose. Colours and appearance can vary by screen and product batch. Prices, product details and stock availability may change. The price and availability are checked by the store when an order is placed.</p> },
    { title: 'Orders and Cash on Delivery', body: <p>Submitting an order is a request to purchase the selected products. An order is subject to product availability and fulfilment confirmation. The store currently offers Cash on Delivery; the displayed order total is payable when the order is delivered. No online payment is collected through this checkout.</p> },
    { title: 'Delivery and order support', body: <p>Delivery arrangements and timing depend on the order and delivery location. Order status updates are shown in your account where available. For delivery questions, changes or cancellation requests, contact FYNE SURFACES as soon as possible and include your order number.</p> },
    { title: 'Returns and issues', body: <p>For damaged, incorrect or unwanted products, follow the instructions on our <a className="font-semibold text-primary underline underline-offset-4" href="/return-policy">Return Policy</a> and contact the team before sending any item back.</p> },
    { title: 'Website content', body: <p>Website copy, photographs, brand assets and other materials belong to FYNE SURFACES or their respective owners. Do not copy or reuse them commercially without permission.</p> },
    { title: 'Changes and contact', body: <p>We may update these terms as store operations change. The current version will be published on this page. Questions about these terms can be sent through our <a className="font-semibold text-primary underline underline-offset-4" href="/contact">contact page</a>.</p> },
  ]} />;
}
