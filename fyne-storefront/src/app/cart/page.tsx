'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Lock, ShoppingBag, Trash2 } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { selectCount, selectSubtotal, useCart } from '@/store/cart';
import { estimateShipping, useStoreSettings } from '@/lib/useStoreSettings';
import { ButtonLink } from '@/components/ui/Button';
import { PlantImage } from '@/components/ui/PlantImage';
import { QtyStepper } from '@/components/cart/QtyStepper';
import { PageBanner } from '@/components/layout/PageBanner';

export default function CartPage() {
  const { items, hydrated, updateQty, removeItem } = useCart();
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);
  const settings = useStoreSettings();
  const shipping = estimateShipping(subtotal, settings);

  if (!hydrated) return <><PageBanner eyebrow="Your bag" title="Shopping cart" description="Your saved items will appear here." /><section className="container min-h-[35vh] py-20" aria-busy="true" /></>;

  if (!items.length) {
    return (
      <>
      <PageBanner eyebrow="Your bag" title="Your cart is empty" description="Discover lifelike greenery for homes, offices and projects." />
      <section className="container flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-50 text-primary"><ShoppingBag className="h-9 w-9" /></span>
        <h2 className="mt-8 text-display-md text-ink">Your artificial plants cart in Mumbai is empty</h2>
        <p className="mt-3 max-w-md text-lg text-ink-muted">Discover lifelike trees, plants and bush packs that stay green all year.</p>
        <ButtonLink href="/collections" size="lg" className="mt-10">Explore collections</ButtonLink>
      </section>
      </>
    );
  }

  return (
    <>
    <PageBanner eyebrow="Your bag" title="Shopping cart" description={`${count} ${count === 1 ? 'item' : 'items'} saved in your cart.`} />
    <section className="container pb-28 pt-12 lg:pt-16">
      <Link href="/collections" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Continue shopping
      </Link>
      <h2 className="mt-6 text-display-md text-ink">Your artificial plants cart in Mumbai <span className="text-ink-faint">({count})</span></h2>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          <div className="hidden grid-cols-12 border-b border-line pb-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint md:grid">
            <span className="col-span-6">Product</span>
            <span className="col-span-3 text-center">Quantity</span>
            <span className="col-span-3 text-right">Total</span>
          </div>
          <ul className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {items.map((item) => (
                <motion.li key={item.productId} layout exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35 }} className="grid grid-cols-12 items-center gap-4 py-7">
                  <div className="col-span-12 flex gap-5 md:col-span-6">
                    <Link href={`/products/${item.slug}`} className="relative h-32 w-[104px] shrink-0 overflow-hidden rounded-2xl bg-sand">
                      <PlantImage src={item.image} alt={item.name} seed={item.slug} sizes="104px" />
                    </Link>
                    <div className="flex min-w-0 flex-col justify-center">
                      {item.collection && <p className="text-xs uppercase tracking-[0.14em] text-accent-700">{item.collection}</p>}
                      <Link href={`/products/${item.slug}`} className="mt-1 text-lg font-semibold text-ink hover:text-primary">{item.name}</Link>
                      <p className="mt-1 text-[13px] text-ink-muted">SKU {item.sku} · {formatINR(item.price)}</p>
                      <button onClick={() => removeItem(item.productId)} className="mt-3 inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-3 md:flex md:justify-center">
                    <QtyStepper size="sm" value={item.qty} onChange={(v) => updateQty(item.productId, v)} label={`Quantity of ${item.name}`} />
                  </div>
                  <p className="col-span-6 text-right text-lg font-semibold tabular-nums text-ink md:col-span-3">{formatINR(item.price * item.qty)}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>

        <aside className="lg:col-span-4" aria-labelledby="summary-heading">
          <div className="rounded-[1.75rem] bg-canvas p-7 lg:sticky lg:top-28 lg:p-8">
            <h2 id="summary-heading" className="text-lg font-semibold text-ink">Order summary</h2>
            <dl className="mt-6 space-y-3 text-[15px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-medium tabular-nums text-ink">{formatINR(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="font-medium tabular-nums text-ink">{shipping ? formatINR(shipping) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-line pt-4 text-lg"><dt className="font-semibold text-ink">Estimated total</dt><dd className="font-semibold tabular-nums text-ink">{formatINR(subtotal + shipping)}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-ink-muted">Prices include GST. Discount codes can be applied at checkout.</p>
            <ButtonLink href="/checkout" size="lg" className="mt-7 w-full"><Lock className="h-4 w-4" /> Proceed to Checkout</ButtonLink>
          </div>
        </aside>
      </div>
    </section>
    </>
  );
}
