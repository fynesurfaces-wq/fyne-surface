import type { ReactNode } from 'react';
import { PlantImage } from '@/components/ui/PlantImage';

export function PageBanner({ title, eyebrow, description, children, image, imageAlt, priority = false }: { title: string; eyebrow?: string; description?: string; children?: ReactNode; image?: string | null; imageAlt?: string; priority?: boolean }) {
  const bannerImage = image || '/images/banners/modern-trailing-plant-home-vignette.webp';
  return (
    <header className="relative isolate min-h-[220px] overflow-hidden border-b border-line bg-gradient-to-br from-primary-50 via-white to-accent-50 sm:min-h-[250px]">
      {bannerImage ? <div aria-hidden className="absolute inset-0 -z-10">
        <PlantImage src={bannerImage} alt={imageAlt || ''} seed={title} sizes="100vw" priority={priority} className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/70 to-white/30 sm:from-white/75 sm:via-white/50 sm:to-white/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/25 via-transparent to-white/10" />
      </div> : <div aria-hidden className="absolute -right-20 -top-28 -z-10 h-80 w-80 rounded-full bg-primary-100/60 blur-3xl" />}
      <div className="container relative py-12 sm:py-16 lg:py-20">
        {eyebrow && <p className="text-eyebrow uppercase text-accent-700">{eyebrow}</p>}
        <h1 className="mt-3 max-w-4xl font-serif text-display-lg text-ink">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">{description}</p>}
        {children}
      </div>
    </header>
  );
}
