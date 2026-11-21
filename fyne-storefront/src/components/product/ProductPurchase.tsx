'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProductDetail } from '@/lib/types';
import { useCart } from '@/store/cart';
import { Button } from '@/components/ui/Button';
import { QtyStepper } from '@/components/cart/QtyStepper';
import { AddToCartButton, toCartItem } from './AddToCartButton';

/** Quantity + Add to Cart (primary green) + Buy Now. */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const close = useCart((s) => s.close);
  const inStock = product.availability.inStock;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        {inStock && <QtyStepper value={qty} onChange={(v) => setQty(Math.max(1, v))} />}
        <AddToCartButton product={product} qty={qty} inStock={inStock} size="lg" className="h-12 flex-1" />
      </div>
      {inStock && (
        <Button
          variant="dark"
          size="lg"
          className="h-12 w-full"
          onClick={() => {
            addItem(toCartItem(product), qty);
            close();
            router.push('/checkout');
          }}
        >
          Buy it now
        </Button>
      )}
    </div>
  );
}
