'use client';

import { useEffect, useState } from 'react';
import { Camera, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get, getApiError, patch } from '@/lib/api';
import type { Image } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, PageHeader } from '@/components/ui/misc';
import { ImageUploader } from '@/features/media/ImageUploader';

interface InstagramReel { url: string; caption: string; isActive: boolean }
interface SiteContent { isEnabled: boolean; eyebrow: string; title: string; body: string; ctaLabel: string; ctaHref: string; image?: Image | null; reels: InstagramReel[] }
const DEFAULT: SiteContent = { isEnabled: true, eyebrow: 'Built to last', title: '', body: '', ctaLabel: 'Plan your project', ctaHref: '/contact', image: null, reels: [] };
const INSTAGRAM_REEL_URL = /^https:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?(?:\?[A-Za-z0-9_=&%-]*)?$/i;

export default function SiteContentPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(DEFAULT);
  const { data, isLoading } = useQuery({ queryKey: ['legacy-site-content'], queryFn: () => get<{ data: SiteContent }>('/admin/site-content/legacy').then((r) => r.data) });
  useEffect(() => { if (data) setForm({ ...DEFAULT, ...data, reels: data.reels || [] }); }, [data]);
  const save = useMutation({
    mutationFn: () => patch<{ data: SiteContent }>('/admin/site-content/legacy', form),
    onSuccess: (result) => { setForm({ ...DEFAULT, ...result.data, reels: result.data.reels || [] }); toast.success('Site content and Instagram reels saved'); qc.invalidateQueries({ queryKey: ['legacy-site-content'] }); },
    onError: (error) => toast.error(getApiError(error).message),
  });
  const set = <K extends keyof SiteContent>(key: K, value: SiteContent[K]) => setForm((current) => ({ ...current, [key]: value }));
  const updateReel = (index: number, patch: Partial<InstagramReel>) => set('reels', form.reels.map((reel, i) => i === index ? { ...reel, ...patch } : reel));
  const field = 'mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:shadow-ring';
  return <>
    <PageHeader title="Site Content" description="Manage homepage content, Instagram reels and the About page CTA." actions={<Button onClick={() => { if (form.reels.some((reel) => !INSTAGRAM_REEL_URL.test(reel.url.trim()))) { toast.error('Add a valid Instagram Reel URL or remove the empty reel row.'); return; } save.mutate(); }} loading={save.isPending} disabled={isLoading}>Save changes</Button>} />
    <Card className="max-w-4xl">
      <CardHeader title="Legacy & Events CTA" description="Keep the wording, image and destination aligned with your current projects." />
      <div className="space-y-5 p-5 sm:p-7">
        <label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={form.isEnabled} onChange={(e) => set('isEnabled', e.target.checked)} className="h-4 w-4 accent-primary" /> Show this section on the storefront</label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Eyebrow<input maxLength={80} value={form.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} className={field} /></label>
          <label className="text-sm font-medium">Button label<input required maxLength={60} value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} className={field} /></label>
        </div>
        <label className="block text-sm font-medium">Heading<input required maxLength={160} value={form.title} onChange={(e) => set('title', e.target.value)} className={field} /></label>
        <label className="block text-sm font-medium">Description<textarea required rows={4} maxLength={1200} value={form.body} onChange={(e) => set('body', e.target.value)} className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:shadow-ring" /></label>
        <label className="block text-sm font-medium">Button destination<input required maxLength={300} value={form.ctaHref} onChange={(e) => set('ctaHref', e.target.value)} placeholder="/contact" className={field} /><span className="mt-1 block text-xs text-muted-foreground">Use a local storefront path such as /contact.</span></label>
        <div><p className="mb-2 text-sm font-medium">Background image</p><ImageUploader value={form.image ? [form.image] : []} onChange={(images) => set('image', images[0] || null)} folder="content" max={1} altFallback={form.title} /></div>
      </div>
    </Card>
    <Card className="mt-6 max-w-4xl">
      <CardHeader title="Instagram Reels" description="Add public Instagram reel links to feature them on the storefront homepage. Up to 8 reels; visitors can also follow @fynesurfaces." />
      <div className="space-y-4 p-5 sm:p-7">
        {form.reels.map((reel, index) => (
          <div key={index} className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-4">
                <label className="block text-sm font-medium">Instagram Reel URL
                  <input type="url" required maxLength={300} value={reel.url} onChange={(e) => updateReel(index, { url: e.target.value })} placeholder="https://www.instagram.com/reel/ABC123/" className={field} />
                  <span className="mt-1 block text-xs text-muted-foreground">Paste the full public Reel link copied from Instagram.</span>
                </label>
                <label className="block text-sm font-medium">Caption (optional)
                  <input maxLength={180} value={reel.caption} onChange={(e) => updateReel(index, { caption: e.target.value })} placeholder="A short description of this reel" className={field} />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={reel.isActive} onChange={(e) => updateReel(index, { isActive: e.target.checked })} className="h-4 w-4 accent-primary" /> Show on homepage</label>
              </div>
              <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} aria-label={`Remove reel ${index + 1}`} onClick={() => set('reels', form.reels.filter((_, i) => i !== index))}>Remove</Button>
            </div>
          </div>
        ))}
        {form.reels.length < 8 && <Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => set('reels', [...form.reels, { url: '', caption: '', isActive: true }])}>Add Reel</Button>}
        {form.reels.length === 0 && <div className="flex items-center gap-3 rounded-xl bg-primary-50 p-4 text-sm text-primary-900"><Camera className="h-5 w-5 shrink-0" /><p>No reels added yet. Add a public Instagram Reel URL, then save changes to show it on the homepage.</p></div>}
        <p className="text-xs text-muted-foreground">Instagram must allow embedding for the reel to display. Changes appear on the storefront after its short content cache expires.</p>
      </div>
    </Card>
  </>;
}
