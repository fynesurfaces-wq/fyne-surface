import type { Metadata } from 'next';
import { LegalPage } from '@/components/support/LegalPage';
import { policyFaqs } from '@/lib/page-faqs';

export const metadata: Metadata = { title: 'Privacy Policy', description: 'Learn how FYNE SURFACES uses account, order and contact information when you browse or shop artificial plants and green wall products.', alternates: { canonical: '/privacy-policy' } };

export default function PrivacyPolicyPage() {
  return <LegalPage eyebrow="Your privacy" title="Privacy Policy" description="How we use the information you share when you browse, contact us or place an order." image="/images/banners/minimal-botanical-interior-with-sunlit-shadows.webp" faqs={policyFaqs('privacy')} sections={[
    { title: 'Information you provide', body: <><p>When you create an account, place an order or send an enquiry, we may collect your name, email address, phone number, delivery address, order details and the message you submit.</p><p>Account passwords are handled by the account system and are not shown in your customer profile. Do not include sensitive personal information in contact form messages.</p></> },
    { title: 'How we use information', body: <><p>We use this information to manage sign-in and email verification, process Cash on Delivery orders, arrange fulfilment, provide order support, respond to enquiries and maintain the security of the website.</p><p>We may use essential technical data, such as page activity and device information, to operate and improve the store.</p></> },
    { title: 'Sharing and service providers', body: <p>We share information only as needed to run the store, such as with hosting, email and delivery service providers, or when disclosure is required to protect the store or comply with applicable law. We do not sell customer contact details.</p> },
    { title: 'Storage and security', body: <p>We use access controls and security measures intended to protect account, order and enquiry information. Information is retained for as long as needed to provide the service, maintain business records, resolve issues and meet applicable requirements.</p> },
    { title: 'Your choices', body: <><p>You can update your profile information from your account. To ask about, correct or request removal of personal information, contact us using the details on our contact page. Some order or business records may need to be retained where required for legitimate operational or legal purposes.</p><p>You can choose whether to receive optional marketing messages. Order and account service messages may still be sent when needed to complete a requested service.</p></> },
    { title: 'Policy updates', body: <p>We may update this policy as the store and its services change. The current version will be published on this page.</p> },
  ]} />;
}
