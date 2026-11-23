'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectCount, useCart } from '@/store/cart';
import type { CollectionSummary } from '@/lib/types';
import { Logo } from '@/components/ui/Logo';
import { PlantImage } from '@/components/ui/PlantImage';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Sticky header.
 *  - Over the homepage hero (top of page): transparent with white text.
 *  - Once the user scrolls: solid white, hairline border, dark text.
 *  - Collections mega menu, expandable search, live cart counter.
 */
export function Navbar({ collections }: { collections: CollectionSummary[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const overlayPage = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const megaTimer = useRef<ReturnType<typeof setTimeout>>();

  const count = useCart(selectCount);
  const hydrated = useCart((s) => s.hydrated);
  const openCart = useCart((s) => s.open);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMega(false);
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
  }, [mobileOpen]);

  const transparent = overlayPage && !scrolled && !mega && !searchOpen;

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
    setSearchOpen(false);
  };

  const openMega = () => {
    clearTimeout(megaTimer.current);
    setMega(true);
  };
  const closeMega = () => {
    megaTimer.current = setTimeout(() => setMega(false), 120);
  };

  const linkCls = (active = false) => cn(
    "relative text-[14px] font-medium tracking-[-0.005em] transition-colors duration-300 after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-accent after:content-[''] after:transition-transform after:duration-300 hover:after:scale-x-100 focus-visible:after:scale-x-100",
    transparent ? 'text-white/90 hover:text-white' : 'text-ink-soft hover:text-ink',
    active && 'after:scale-x-100'
  );
  const mobileLinkCls = (active: boolean) => cn(
    "relative inline-flex pb-2 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-accent after:content-[''] after:transition-transform after:duration-300",
    active && 'after:scale-x-100'
  );

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-500 ease-premium',
          transparent ? 'border-b border-transparent bg-transparent' : 'border-b border-primary-900/[0.06] bg-white/95 shadow-[0_8px_30px_-24px_rgba(8,26,10,0.45)] backdrop-blur-xl'
        )}
        onMouseLeave={closeMega}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm">
          Skip to content
        </a>
        <div className="container flex h-[72px] items-center gap-6 lg:h-20">
          {/* Mobile menu button */}
          <button onClick={() => setMobileOpen(true)} className={cn('-ml-2 rounded-full p-2 lg:hidden', transparent ? 'text-white' : 'text-ink')} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>

          <Link href="/" className="shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="FYNE SURFACES — Home">
            <Logo inverted={transparent} />
          </Link>

          <nav aria-label="Primary" className="ml-6 hidden items-center gap-8 lg:flex">
            <button
              className={cn(linkCls(pathname.startsWith('/collections/') || mega), 'flex items-center gap-1')}
              onMouseEnter={openMega}
              onFocus={openMega}
              onClick={() => setMega((m) => !m)}
              aria-expanded={mega}
              aria-controls="mega-menu"
            >
              Collections <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', mega && 'rotate-180')} />
            </button>
            <Link href="/collections" className={linkCls(pathname === '/collections')} aria-current={pathname === '/collections' ? 'page' : undefined}>Shop All</Link>
            <Link href="/pages/about" className={linkCls(pathname === '/pages/about')} aria-current={pathname === '/pages/about' ? 'page' : undefined}>Our Story</Link>
            <Link href="/pages/contact" className={linkCls(pathname === '/pages/contact')} aria-current={pathname === '/pages/contact' ? 'page' : undefined}>Contact</Link>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <button onClick={() => setSearchOpen((s) => !s)} className={cn('rounded-full p-2.5 transition-colors', transparent ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-ink/5')} aria-label="Search" aria-expanded={searchOpen}>
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <button onClick={openCart} className={cn('relative rounded-full p-2.5 transition-colors', transparent ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-ink/5')} aria-label={`Open cart${hydrated && count ? `, ${count} items` : ''}`}>
              <ShoppingBag className="h-5 w-5" />
              <AnimatePresence>
                {hydrated && count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white ring-2 ring-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden border-t border-line bg-white">
              <form onSubmit={onSearch} role="search" className="container flex items-center gap-4 py-5">
                <Search className="h-5 w-5 text-ink-muted" aria-hidden />
                <label htmlFor="site-search" className="sr-only">Search products</label>
                <input
                  id="site-search"
                  ref={searchRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search palms, orchids, bushes…"
                  className="h-11 flex-1 bg-transparent text-lg text-ink placeholder:text-ink-faint focus:outline-none"
                />
                <button type="submit" className="hidden rounded-full bg-ink px-5 py-2 text-sm font-medium text-white sm:block">Search</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mega menu */}
        <AnimatePresence>
          {mega && (
            <motion.div
              id="mega-menu"
              onMouseEnter={openMega}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="absolute inset-x-0 top-full hidden border-t border-line bg-white shadow-lift lg:block"
            >
              <div className="container grid grid-cols-12 gap-10 py-10">
                <div className="col-span-3">
                  <p className="text-eyebrow uppercase text-accent">Collections</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">Greenery that never fades.</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">Lifelike trees, plants and bush packs for homes, offices and hospitality spaces.</p>
                  <Link href="/collections" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all">
                    Shop all collections <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <ul className="col-span-9 grid grid-cols-3 gap-6">
                  {collections.slice(0, 10).map((c) => (
                    <li key={c.id}>
                      <Link href={`/collections/${c.slug}`} className="group block">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-sand">
                          <PlantImage src={c.coverImage?.url} alt={c.coverImage?.alt || c.name} seed={c.slug} sizes="320px" className="transition-transform duration-700 ease-premium group-hover:scale-105" />
                        </div>
                        <p className="mt-3 flex items-center justify-between font-semibold text-ink">
                          {c.name}
                          <ArrowRight className="h-4 w-4 -translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                        </p>
                        <p className="text-sm text-ink-muted">{c.productCount} {c.productCount === 1 ? 'product' : 'products'}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer so content isn't hidden under the fixed header (homepage hero sits underneath on purpose) */}
      {!overlayPage && <div className="h-[72px] lg:h-20" aria-hidden />}

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div className="fixed inset-0 z-[60] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.nav
              aria-label="Mobile"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.45, ease: EASE }}
              className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white"
            >
              <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
                <Logo />
                <button onClick={() => setMobileOpen(false)} className="rounded-full p-2 text-ink" aria-label="Close menu"><X className="h-6 w-6" /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <p className="text-eyebrow uppercase text-accent">Collections</p>
                <ul className="mt-3 divide-y divide-line">
                  {collections.map((c) => (
                    <li key={c.id}>
                      <Link href={`/collections/${c.slug}`} className={cn('flex items-center justify-between py-4 text-lg font-medium text-ink', mobileLinkCls(pathname === `/collections/${c.slug}`))} aria-current={pathname === `/collections/${c.slug}` ? 'page' : undefined}>
                        {c.name} <span className="text-sm text-ink-faint">{c.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 space-y-4 text-base font-medium text-ink-soft">
                  <Link href="/collections" className={mobileLinkCls(pathname === '/collections')} aria-current={pathname === '/collections' ? 'page' : undefined}>Shop All</Link>
                  <Link href="/pages/about" className={mobileLinkCls(pathname === '/pages/about')} aria-current={pathname === '/pages/about' ? 'page' : undefined}>Our Story</Link>
                  <Link href="/pages/contact" className={mobileLinkCls(pathname === '/pages/contact')} aria-current={pathname === '/pages/contact' ? 'page' : undefined}>Contact</Link>
                  <Link href="/cart" className={mobileLinkCls(pathname === '/cart')} aria-current={pathname === '/cart' ? 'page' : undefined}>Cart{hydrated && count ? ` (${count})` : ''}</Link>
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
