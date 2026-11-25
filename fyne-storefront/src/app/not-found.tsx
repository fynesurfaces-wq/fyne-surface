import { ButtonLink } from '@/components/ui/Button';
import { PageBanner } from '@/components/layout/PageBanner';

export default function NotFound() {
  return (
    <>
    <PageBanner eyebrow="404" title="We couldn’t find that page" description="The page may have moved or no longer exists. Browse our artificial plant collections to find something for your space." image="/images/banners/airy-botanical-foliage-banner.webp" imageAlt="Airy botanical foliage" />
    <section className="container flex min-h-[45vh] flex-col items-center justify-center py-16 text-center">
      <div className="mt-10 flex gap-3">
        <ButtonLink href="/collections" size="lg">Shop collections</ButtonLink>
        <ButtonLink href="/" size="lg" variant="outline">Go home</ButtonLink>
      </div>
    </section>
    </>
  );
}
