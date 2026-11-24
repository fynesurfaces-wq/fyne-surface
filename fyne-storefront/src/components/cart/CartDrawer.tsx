'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, ShoppingBag, X } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { selectCount, selectSubtotal, useCart } from '@/store/cart';
import { ButtonLink } from '@/components/ui/Button';
import { PlantImage } from '@/components/ui/PlantImage';
import { QtyStepper } from './QtyStepper';

const EASE = [0.22, 1, 0.36, 1] as const;

/** Slide-in mini cart, opened automatically on "Add to Cart". */
export function CartDrawer() {
  const pathname = usePathname();
  const { items, isOpen, close, updateQty, removeItem } = useCart();
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);

  useEffect(() => close(), [pathname, close]);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <div className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]" onClick={close} aria-hidden />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-white shadow-drawer"
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-lg font-semibold tracking-tight text-ink">
                Your cart {count > 0 && <span className="font-normal text-ink-muted">({count})</span>}
              </h2>
              <button onClick={close} className="-mr-2 rounded-full p-2 text-ink-soft hover:bg-ink/5 hover:text-ink" aria-label="Close cart" autoFocus>
                <X className="h-5 w-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary"><ShoppingBag className="h-7 w-7" /></span>
                <p className="mt-5 text-lg font-semibold text-ink">Your cart is empty</p>
                <p className="mt-1.5 text-sm text-ink-muted">Discover lifelike artificial plants for every space.</p>
                <ButtonLink href="/collections" className="mt-7" onClick={close}>Explore collections</ButtonLink>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li key={item.productId} layout exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.3 }} className="flex gap-4 py-5">
                        <Link href={`/products/${item.slug}`} className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                          <PlantImage src={item.image} alt={item.name} seed={item.slug} sizes="80px" />
                        </Link>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link href={`/products/${item.slug}`} className="line-clamp-2 font-medium text-ink hover:text-primary">{item.name}</Link>
                              <p className="mt-0.5 text-xs uppercase tracking-wider text-ink-faint">{item.sku}</p>
                            </div>
                            <p className="whitespace-nowrap font-semibold tabular-nums text-ink">{formatINR(item.price * item.qty)}</p>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-3">
                            <QtyStepper size="sm" value={item.qty} onChange={(v) => updateQty(item.productId, v)} label={`Quantity of ${item.name}`} />
                            <button onClick={() => removeItem(item.productId)} className="text-xs font-medium text-ink-muted underline-offset-4 hover:text-ink hover:underline">Remove</button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                <footer className="border-t border-line bg-canvas px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-ink-soft">Subtotal</span>
                    <span className="text-xl font-semibold tabular-nums text-ink">{formatINR(subtotal)}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">Prices include GST. Shipping calculated at checkout.</p>
                  <ButtonLink href="/checkout" size="lg" className="mt-5 w-full" onClick={close}>
                    <Lock className="h-4 w-4" /> Proceed to Checkout
                  </ButtonLink>
                  <Link href="/cart" onClick={close} className="mt-3 block text-center text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline">View full cart</Link>
                </footer>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
