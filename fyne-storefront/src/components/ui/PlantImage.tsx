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
  fit = 'cover',
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  seed?: string;
  fit?: 'cover' | 'contain';
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
      unoptimized={
        (src.startsWith('/') && !src.startsWith('//')) ||
        /^https:\/\/ik\.imagekit\.io\//i.test(src)
      }
      onError={() => setFailed(true)}
      className={cn(fit === 'contain' ? 'object-contain p-3' : 'object-cover [filter:saturate(1.08)_contrast(1.025)]', className)}
    />
  );
}
