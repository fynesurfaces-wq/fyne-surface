'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BotanicalArt } from './BotanicalArt';

/**
 * Product/collection image with an elegant botanical placeholder when no photo
 * exists yet (or a remote image fails). Always fills its (positioned) parent.
 */
export function PlantImage({
  src,
  alt,
  sizes,
  priority,
  className,
  seed,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  seed?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className={cn('absolute inset-0', className)} role="img" aria-label={alt}>
        <BotanicalArt seed={seed || alt} />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      quality={80}
      unoptimized={src.startsWith('/') && !src.startsWith('//')}
      onError={() => setFailed(true)}
      className={cn('object-cover [filter:saturate(1.08)_contrast(1.025)]', className)}
    />
  );
}
