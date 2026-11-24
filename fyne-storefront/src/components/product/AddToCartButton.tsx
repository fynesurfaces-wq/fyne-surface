'use client';

import { useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import { useCart } from '@/store/cart';
import { Button, type ButtonProps } from '@/components/ui/Button';
import type { ProductSummary } from '@/lib/types';

export function toCartItem(p: Pick<ProductSummary, 'id' | 'slug' | 'name' | 'sku' | 'price' | 'images' | 'collection'>) {
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name || `SKU ${p.sku}`,
    sku: p.sku,
    price: p.price.amount,
    image: p.images[0]?.url ?? null,
    collection: p.collection?.name,
  };
}

/** Adds to the Zustand cart and opens the drawer; brief "Added" confirmation. */
export function AddToCartButton({
  product,
  qty = 1,
  inStock,
  label = 'Add to Cart',
  ...props
}: { product: Parameters<typeof toCartItem>[0]; qty?: number; inStock: boolean; label?: string } & Omit<ButtonProps, 'onClick'>) {
  const addItem = useCart((s) => s.addItem);
  const [added, setAdded] = useState(false);

  if (!inStock) {
    return (
      <Button {...props} variant="outline" disabled>
        Out of stock
      </Button>
    );
  }

  return (
    <Button
      {...props}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(toCartItem(product), qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 1600);
      }}
      aria-live="polite"
    >
      {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
      {added ? 'Added' : label}
    </Button>
  );
}
