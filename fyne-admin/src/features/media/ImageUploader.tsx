'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Star, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import { api, getApiError } from '@/lib/api';
import type { Image } from '@/lib/types';
import { cn } from '@/lib/utils';

const MAX_MB = 8;
const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
// Relative catalog images are served through the admin Next.js /images proxy.
const displayImageUrl = (url: string) => url;

/**
 * Upload → POST /admin/media (multipart "files") → ImageKit → [{url, publicId}].
 *
 * If ImageKit isn't configured on the API yet (503 UPLOADS_DISABLED), we
 * SIMULATE the upload with branded placeholder URLs so the full product flow
 * still works end-to-end in development.
 */
async function uploadFiles(files: File[], folder: string): Promise<{ images: Image[]; simulated: boolean }> {
  const fd = new FormData();
  files.forEach((f) => fd.append('files', f));
  fd.append('folder', folder);
  try {
    const { data } = await api.post<{ data: { url: string; publicId: string }[] }>('/admin/media', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    });
    return { images: data.data.map((d) => ({ url: d.url, publicId: d.publicId, unoptimized: true })), simulated: false };
  } catch (err) {
    if (getApiError(err).code !== 'UPLOADS_DISABLED') throw err;
    await new Promise((r) => setTimeout(r, 700)); // feel like an upload
    return {
      simulated: true,
      images: files.map((f, i) => ({
        url: `https://placehold.co/800x800/2E7D32/FFFFFF/png?text=${encodeURIComponent(f.name.replace(/\.[^.]+$/, '').slice(0, 18) || `Image ${i + 1}`)}`,
      })),
    };
  }
}

interface Props {
  value: Image[];
  onChange: (images: Image[]) => void;
  folder?: 'products' | 'collections' | 'content';
  max?: number;
  altFallback?: string;
}

export function ImageUploader({ value, onChange, folder = 'products', max = 10, altFallback = '' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const single = max === 1;

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list).filter((f) => {
      if (!ACCEPT.includes(f.type)) { toast.error(`${f.name}: unsupported format`); return false; }
      if (f.size > MAX_MB * 1024 * 1024) { toast.error(`${f.name}: larger than ${MAX_MB} MB`); return false; }
      return true;
    }).slice(0, single ? 1 : Math.max(0, max - value.length));
    if (!files.length) return;

    setUploading(files.length);
    try {
      const { images, simulated } = await uploadFiles(files, folder);
      const withAlt = images.map((img) => ({ ...img, alt: altFallback || undefined }));
      onChange(single ? withAlt : [...value, ...withAlt]);
      if (simulated) toast.info('ImageKit not configured — using placeholder images (simulated upload).');
    } catch (err) {
      toast.error(getApiError(err).message);
    } finally {
      setUploading(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const makeCover = (i: number) => onChange([value[i], ...value.filter((_, idx) => idx !== i)]);
  const setAlt = (i: number, alt: string) => onChange(value.map((img, idx) => (idx === i ? { ...img, alt } : img)));

  const canAdd = !single || value.length === 0;

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className={cn('grid gap-3', single ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-4')}>
          {value.map((img, i) => (
            <li key={`${img.url}-${i}`} className="group relative overflow-hidden rounded-xl border border-border bg-muted">
              <img src={displayImageUrl(img.url)} alt={img.alt || altFallback} className={cn('w-full object-cover', single ? 'aspect-[16/7]' : 'aspect-square')} />
              {!single && i === 0 && (
                <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Cover</span>
              )}
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                {!single && i > 0 && (
                  <button type="button" onClick={() => makeCover(i)} className="rounded-md bg-white/95 p-1.5 text-secondary shadow hover:bg-white" title="Set as cover" aria-label="Set as cover">
                    <Star className="h-3.5 w-3.5" />
                  </button>
                )}
                <button type="button" onClick={() => remove(i)} className="rounded-md bg-white/95 p-1.5 text-danger shadow hover:bg-white" title="Remove" aria-label="Remove image">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                value={img.alt || ''}
                onChange={(e) => setAlt(i, e.target.value)}
                placeholder="Alt text (SEO)"
                maxLength={160}
                className="w-full border-t border-border bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          disabled={!!uploading || value.length >= max}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-7 text-center transition',
            dragOver ? 'border-primary bg-primary-50' : 'border-gray-300 bg-gray-50/60 hover:border-primary-300 hover:bg-primary-50/40',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm font-medium text-ink-soft">Uploading {uploading} image{uploading > 1 ? 's' : ''}…</span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                {value.length ? <ImagePlus className="h-5 w-5" /> : <UploadCloud className="h-5 w-5" />}
              </span>
              <span className="text-sm font-medium text-ink">
                <span className="text-primary">Click to upload</span> or drag & drop
              </span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WebP or AVIF · up to {MAX_MB} MB{!single && ` · ${value.length}/${max}`}</span>
            </>
          )}
        </button>
      )}
      <input ref={inputRef} type="file" accept={ACCEPT} multiple={!single} hidden onChange={(e) => handleFiles(e.target.files)} />
    </div>
  );
}
