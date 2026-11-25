'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { get, getApiError, patch, post } from '@/lib/api';
import type { Image } from '@/lib/types';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/features/media/ImageUploader';
import { RichTextEditor } from './RichTextEditor';

interface ContentRecord {
  _id: string; type: 'page' | 'blog_post'; title: string; slug: string; excerpt?: string; body?: string;
  coverImage?: Image; tags?: string[]; status: 'draft' | 'published'; seo?: { metaTitle?: string; metaDescription?: string };
}
type Fields = { title: string; slug: string; excerpt: string; body: string; tags: string; status: 'draft' | 'published'; metaTitle: string; metaDescription: string };
const BLANK: Fields = { title: '', slug: '', excerpt: '', body: '', tags: '', status: 'draft', metaTitle: '', metaDescription: '' };
const makeSlug = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function ContentEditorModal({ open, contentId, onClose }: { open: boolean; contentId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const editing = Boolean(contentId);
  const [fields, setFields] = useState<Fields>(BLANK);
  const [cover, setCover] = useState<Image[]>([]);
  const { data, isLoading } = useQuery({ queryKey: ['content-item', contentId], queryFn: () => get<{ data: ContentRecord }>(`/admin/content/${contentId}`).then((r) => r.data), enabled: open && editing });

  useEffect(() => {
    if (!open) return;
    if (!editing) { setFields(BLANK); setCover([]); }
    else if (data) {
      setFields({ title: data.title, slug: data.slug, excerpt: data.excerpt || '', body: data.body || '', tags: (data.tags || []).join(', '), status: data.status, metaTitle: data.seo?.metaTitle || '', metaDescription: data.seo?.metaDescription || '' });
      setCover(data.coverImage ? [data.coverImage] : []);
    }
  }, [open, editing, data]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => editing ? patch(`/admin/content/${contentId}`, payload) : post('/admin/content', payload),
    onSuccess: () => { toast.success(editing ? 'Article updated' : 'Article created'); qc.invalidateQueries({ queryKey: ['blog-admin'] }); qc.invalidateQueries({ queryKey: ['content-item', contentId] }); onClose(); },
    onError: (err) => toast.error(getApiError(err).message),
  });
  const set = (key: keyof Fields, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (fields.status === 'published' && !fields.body.replace(/<[^>]*>/g, '').trim()) { toast.error('Add article content before publishing.'); return; }
    const slug = fields.slug.trim() || makeSlug(fields.title);
    const payload = {
      type: 'blog_post', title: fields.title.trim(), slug, excerpt: fields.excerpt.trim(), body: fields.body,
      tags: fields.tags.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean), status: fields.status,
      coverImage: cover[0] || null,
      seo: { metaTitle: fields.metaTitle.trim(), metaDescription: fields.metaDescription.trim() },
    };
    mutation.mutate(payload);
  }

  const field = 'mt-1.5 h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:shadow-ring';
  const textArea = 'mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-primary focus:shadow-ring';
  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit blog article' : 'Create blog article'} description="Draft a useful story, add its search details and publish when ready." size="xl" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="blog-editor" loading={mutation.isPending}>{fields.status === 'published' ? 'Publish article' : 'Save draft'}</Button></>}>
      {isLoading ? <p className="py-12 text-center text-sm text-muted-foreground">Loading article…</p> : (
        <form id="blog-editor" onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Title<input required maxLength={150} value={fields.title} onChange={(e) => set('title', e.target.value)} className={field} /></label>
            <label className="text-sm font-medium">URL slug<input maxLength={160} value={fields.slug} onChange={(e) => set('slug', e.target.value)} placeholder={makeSlug(fields.title) || 'article-url'} className={field} /></label>
          </div>
          <label className="block text-sm font-medium">Quick summary / excerpt<textarea required maxLength={500} rows={3} value={fields.excerpt} onChange={(e) => set('excerpt', e.target.value)} className={textArea} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Tags<input value={fields.tags} onChange={(e) => set('tags', e.target.value)} placeholder="interior design, plant care" className={field} /></label>
            <label className="text-sm font-medium">Publication status<select value={fields.status} onChange={(e) => set('status', e.target.value as Fields['status'])} className={field}><option value="draft">Draft</option><option value="published">Published</option></select></label>
          </div>
          <div><p className="mb-2 text-sm font-medium">Cover image</p><ImageUploader value={cover} onChange={setCover} folder="content" max={1} altFallback={fields.title} /></div>
          <label className="block text-sm font-medium">Article content<RichTextEditor value={fields.body} onChange={(body) => set('body', body)} /></label>
          <details className="rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm font-semibold">Search appearance</summary><div className="mt-4 grid gap-4"><label className="text-sm font-medium">Meta title<input maxLength={70} value={fields.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} className={field} /></label><label className="text-sm font-medium">Meta description<textarea rows={2} maxLength={170} value={fields.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} className={textArea} /></label></div></details>
        </form>
      )}
    </Modal>
  );
}
