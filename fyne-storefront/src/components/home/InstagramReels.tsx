import { ArrowUpRight } from 'lucide-react';
import type { InstagramReel } from '@/lib/types';
import { SocialIcon } from '@/components/layout/SocialIcons';

const INSTAGRAM_URL = 'https://www.instagram.com/fynesurfaces';

function embedUrl(url: string) {
  const match = url.match(/^https:\/\/(?:www\.)?instagram\.com\/reel\/([A-Za-z0-9_-]+)\/?(?:\?[^#]*)?$/i);
  return match ? `https://www.instagram.com/reel/${match[1]}/embed/` : null;
}

export function InstagramReels({ reels = [] }: { reels?: InstagramReel[] }) {
  const activeReels = reels.flatMap((reel) => {
    const src = embedUrl(reel.url);
    return reel.isActive && src ? [{ ...reel, src }] : [];
  });

  return (
    <section aria-labelledby="instagram-reels-heading" className="overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 py-16 sm:py-20 lg:py-24">
      <div className="container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
          <div>
            <p className="text-eyebrow uppercase text-accent-700">Follow our work</p>
            <h2 id="instagram-reels-heading" className="mt-3 font-serif text-display-md text-ink">Green inspiration, in motion.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">See FYNE SURFACES greenery, spaces and project inspiration in our latest Instagram reels.</p>
          </div>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-5 py-3 text-sm font-semibold text-primary-900 shadow-sm transition hover:border-primary/40 hover:bg-primary-50">
            <SocialIcon name="instagram" className="h-4 w-4" /> @fynesurfaces <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        {activeReels.length > 0 ? (
          <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 [scrollbar-width:thin] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {activeReels.map((reel, index) => (
              <article key={`${reel.url}-${index}`} className="w-[min(78vw,300px)] shrink-0 snap-start overflow-hidden rounded-3xl border border-primary-100 bg-white shadow-soft sm:w-auto">
                <iframe
                  src={reel.src}
                  title={reel.caption || `FYNE SURFACES Instagram reel ${index + 1}`}
                  loading="lazy"
                  allow="encrypted-media; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-[440px] w-full border-0 bg-primary-50"
                />
                {reel.caption && <p className="line-clamp-2 px-4 py-3 text-sm leading-5 text-ink-soft">{reel.caption}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-primary-100 bg-white/80 px-6 py-8 text-sm text-ink-muted shadow-sm sm:px-8">
            Follow <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline decoration-primary/30 underline-offset-4">@fynesurfaces</a> for our latest greenery and project reels.
          </div>
        )}
      </div>
    </section>
  );
}
