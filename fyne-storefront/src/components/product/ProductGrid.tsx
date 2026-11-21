import type { ProductSummary } from '@/lib/types';
import { Stagger, StaggerItem } from '@/components/ui/Motion';
import { ProductCard } from './ProductCard';

export function ProductGrid({ products, headingLevel = 'h2' }: { products: ProductSummary[]; headingLevel?: 'h2' | 'h3' }) {
  return (
    <Stagger className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16 xl:grid-cols-4">
      {products.map((p, i) => (
        <StaggerItem key={p.id}>
          <ProductCard product={p} priority={i < 4} headingLevel={headingLevel} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
