'use client';

import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError, getFieldErrors, patch, post } from '@/lib/api';
import type { Collection } from '@/lib/types';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Switch, Textarea } from '@/components/ui/Form';
import { ImageUploader } from '@/features/media/ImageUploader';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(10000),
  coverImage: z.array(z.object({ url: z.string().url(), alt: z.string().optional(), publicId: z.string().optional() })).max(1),
  isActive: z.boolean(),
  sortOrder: z.number({ invalid_type_error: 'Enter a number' }).int(),
  metaTitle: z.string().max(70, 'Max 70 characters'),
  metaDescription: z.string().max(170, 'Max 170 characters'),
});
type Values = z.infer<typeof schema>;

const toValues = (c?: Collection | null): Values => ({
  name: c?.name ?? '',
  description: c?.description ?? '',
  coverImage: c?.coverImage ? [c.coverImage] : [],
  isActive: c?.isActive ?? true,
  sortOrder: c?.sortOrder ?? 0,
  metaTitle: c?.seo?.metaTitle ?? '',
  metaDescription: c?.seo?.metaDescription ?? '',
});

export function CollectionFormModal({ open, onClose, collection }: { open: boolean; onClose: () => void; collection?: Collection | null }) {
  const isEdit = !!collection;
  const qc = useQueryClient();
  const { register, handleSubmit, control, reset, setError, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: toValues() });
  const [title, desc, name] = useWatch({ control, name: ['metaTitle', 'metaDescription', 'name'] });

  useEffect(() => {
    if (open) reset(toValues(collection));
  }, [open, collection, reset]);

  const mutation = useMutation({
    mutationFn: (v: Values) => {
      const body = {
        name: v.name,
        description: v.description.trim(),
        coverImage: v.coverImage[0] ?? null,
        isActive: v.isActive,
        sortOrder: v.sortOrder,
        seo: { ...(v.metaTitle && { metaTitle: v.metaTitle }), ...(v.metaDescription && { metaDescription: v.metaDescription }) },
      };
      return isEdit ? patch<{ data: Collection }>(`/admin/collections/${collection!._id}`, body) : post<{ data: Collection }>('/admin/collections', body);
    },
    onSuccess: ({ data }) => {
      toast.success(isEdit ? `“${data.name}” saved` : `Collection “${data.name}” created`);
      qc.invalidateQueries({ queryKey: ['collections'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
    onError: (err) => {
      const e = getApiError(err);
      if (e.code === 'DUPLICATE_KEY') return setError('name', { message: 'A collection with this name already exists' });
      const fields = getFieldErrors(err);
      if (fields.length) fields.forEach((f) => setError((f.field.replace('seo.', '') as keyof Values) || 'name', { message: f.message }));
      else toast.error(e.message);
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit collection' : 'New collection'}
      description={isEdit ? collection?.slug && `/collections/${collection.slug}` : 'Group products, e.g. “1.2mtr & Above” or “Bushes Collection”.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button type="submit" form="collection-form" loading={mutation.isPending}>{isEdit ? 'Save changes' : 'Create collection'}</Button>
        </>
      }
    >
      <form id="collection-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5" noValidate>
        <Field label="Name" htmlFor="c-name" required error={errors.name?.message}>
          <Input id="c-name" placeholder="1.2mtr & Above" invalid={!!errors.name} {...register('name')} />
        </Field>
        <Field label="Cover image" error={errors.coverImage?.message}>
          <Controller control={control} name="coverImage" render={({ field }) => (
            <ImageUploader value={field.value} onChange={field.onChange} max={1} folder="collections" altFallback={name} />
          )} />
        </Field>
        <Field label="Description" htmlFor="c-desc" hint="Basic HTML allowed.">
          <Textarea id="c-desc" rows={3} placeholder="<p>Statement artificial trees above 1.2 metres…</p>" {...register('description')} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Sort order" htmlFor="c-sort" error={errors.sortOrder?.message} hint="Lower numbers appear first">
            <Input id="c-sort" type="number" step="1" {...register('sortOrder', { valueAsNumber: true })} />
          </Field>
          <div className="flex items-end pb-1">
            <Controller control={control} name="isActive" render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} label={field.value ? 'Visible on store' : 'Hidden'} />
            )} />
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-gray-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO</p>
          <Field label="Meta title" htmlFor="c-mt" error={errors.metaTitle?.message} counter={{ value: title.length, max: 70 }}>
            <Input id="c-mt" {...register('metaTitle')} />
          </Field>
          <Field label="Meta description" htmlFor="c-md" error={errors.metaDescription?.message} counter={{ value: desc.length, max: 170 }}>
            <Textarea id="c-md" rows={2} {...register('metaDescription')} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
