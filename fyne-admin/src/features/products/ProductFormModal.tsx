'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, ChevronDown, Code2, Globe, Loader2, Plus, Trash2 } from 'lucide-react';
import { get, getApiError, getFieldErrors, patch, post } from '@/lib/api';
import { qk, useNavigation } from '@/lib/queries';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Overlay';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Switch, Textarea } from '@/components/ui/Form';
import { Tabs } from '@/components/ui/misc';
import { ImageUploader } from '@/features/media/ImageUploader';
import { useCollectionOptions } from '@/features/collections/useCollectionOptions';
import {
  API_FIELD_MAP,
  TAB_FIELDS,
  emptyProduct,
  productSchema,
  toFormValues,
  toPayload,
  type ProductFormOutput,
  type ProductFormValues,
} from './productSchema';

type Tab = 'general' | 'specs' | 'seo';

const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function ProductFormModal({ open, onClose, productId }: { open: boolean; onClose: () => void; productId?: string | null }) {
  const isEdit = !!productId;
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('general');
  const { data: collections = [] } = useCollectionOptions();
  const { data: nav } = useNavigation();

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: qk.product(productId || ''),
    queryFn: () => get<{ data: Product }>(`/admin/products/${productId}`).then((r) => r.data),
    enabled: open && isEdit,
  });

  const form = useForm<ProductFormValues, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: emptyProduct(),
    mode: 'onTouched',
  });
  const { register, handleSubmit, control, reset, setError, formState: { errors, isDirty } } = form;

  // Load data into the form when opening.
  useEffect(() => {
    if (!open) return;
    setTab('general');
    if (isEdit && product) reset(toFormValues(product));
    if (!isEdit) reset(emptyProduct(collections[0]?._id ?? ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, product]);

  const mutation = useMutation({
    mutationFn: (values: ProductFormOutput) => {
      const body = toPayload(values);
      return isEdit ? patch<{ data: Product }>(`/admin/products/${productId}`, body) : post<{ data: Product }>('/admin/products', body);
    },
    onSuccess: ({ data }) => {
      toast.success(isEdit ? `“${data.name || data.sku}” saved` : `“${data.name || data.sku}” created`);
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['collections'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['navigation'] });
      qc.setQueryData(qk.product(data._id), data);
      onClose();
    },
    onError: (err) => {
      const e = getApiError(err);
      if (e.code === 'DUPLICATE_KEY') {
        const field = (e.details as { field?: string } | undefined)?.field;
        if (field === 'sku') { setError('sku', { message: 'This SKU is already used by another product' }); setTab('general'); return; }
        if (field === 'name') { setError('name', { message: 'Product names must be unique. Add the SKU to distinguish this product.' }); setTab('general'); return; }
      }
      const fieldErrors = getFieldErrors(err);
      if (fieldErrors.length) {
        let firstTab: Tab | null = null;
        fieldErrors.forEach(({ field, message }) => {
          const name = (API_FIELD_MAP[field] || field) as FieldPath<ProductFormValues>;
          setError(name, { message });
          firstTab ??= tabFor(name);
        });
        if (firstTab) setTab(firstTab);
        toast.error('Please fix the highlighted fields');
        return;
      }
      toast.error(e.message);
    },
  });

  // Jump to the first tab with client-side errors on submit.
  const onInvalid = (errs: typeof errors) => {
    const first = Object.keys(errs)[0];
    if (first) setTab(tabFor(first));
  };

  const tabHasError = (t: Tab) => TAB_FIELDS[t].some((f) => f in errors);
  const dot = (t: Tab) => (tabHasError(t) ? <span className="h-1.5 w-1.5 rounded-full bg-danger" /> : null);

  const close = () => {
    if (isDirty && !mutation.isPending && !window.confirm('Discard unsaved changes?')) return;
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={isEdit ? 'Edit product' : 'Add product'}
      description={isEdit && product ? `${product.name || product.sku} · ${product.sku}` : 'Create a new product in your catalog'}
      footer={
        <>
          <Button variant="outline" onClick={close} disabled={mutation.isPending}>Cancel</Button>
          <Button type="submit" form="product-form" loading={mutation.isPending} disabled={isEdit && loadingProduct}>
            {isEdit ? 'Save changes' : 'Create product'}
          </Button>
        </>
      }
    >
      {isEdit && loadingProduct ? (
        <div className="flex h-72 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <form id="product-form" onSubmit={handleSubmit((v) => mutation.mutate(v), onInvalid)} noValidate className="-mt-1">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'general', label: 'General', badge: dot('general') },
              { value: 'specs', label: 'Specifications', badge: dot('specs') },
              { value: 'seo', label: 'SEO', badge: dot('seo') },
            ]}
          />

          {/* ── GENERAL ─────────────────────────────── */}
          <div className={cn('space-y-5 pt-5', tab !== 'general' && 'hidden')}>
            <Field label="Product name (optional)" htmlFor="name" error={errors.name?.message} hint="Leave blank to show the product SKU instead.">
              <Input id="name" placeholder="e.g. Rhododendron" invalid={!!errors.name} {...register('name')} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SKU" htmlFor="sku" required error={errors.sku?.message} hint="Unique code, e.g. FYN104E">
                <Input id="sku" placeholder="FYN104E" className="uppercase" invalid={!!errors.sku} {...register('sku')} />
              </Field>
              <Field label="Collection" htmlFor="collection" required error={errors.collection?.message}>
                <Select id="collection" invalid={!!errors.collection} {...register('collection')}>
                  <option value="">Select a collection…</option>
                  {collections.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Price (INR)" htmlFor="price" required error={errors.price?.message}>
                <Input id="price" type="number" inputMode="decimal" min={0} step="1" placeholder="125000" leftIcon={<span className="text-sm">₹</span>} invalid={!!errors.price} {...register('price', { valueAsNumber: true })} />
              </Field>
              <Field label="Compare-at price" htmlFor="compareAtPrice" error={errors.compareAtPrice?.message} hint="Optional “MRP” shown struck-through">
                <Input id="compareAtPrice" type="number" inputMode="decimal" min={0} placeholder="—" leftIcon={<span className="text-sm">₹</span>} invalid={!!errors.compareAtPrice} {...register('compareAtPrice')} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Stock quantity" htmlFor="stock" required error={errors.stock?.message}>
                <Input id="stock" type="number" inputMode="numeric" min={0} step="1" invalid={!!errors.stock} {...register('stock', { valueAsNumber: true })} />
              </Field>
              <Field label="Low-stock alert at" htmlFor="lowStockThreshold" error={errors.lowStockThreshold?.message} hint="Leave empty to use the store default">
                <Input id="lowStockThreshold" type="number" inputMode="numeric" min={0} placeholder="5" invalid={!!errors.lowStockThreshold} {...register('lowStockThreshold')} />
              </Field>
            </div>

            <ShortDescriptionField form={form} />

            <Field label="Description" htmlFor="description" error={errors.description?.message} hint="Basic HTML allowed (<p>, <strong>, <ul>…). Scripts are stripped by the server.">
              <Textarea id="description" rows={5} placeholder="<p>Describe the plant, materials, ideal spaces…</p>" className="font-mono text-[13px]" {...register('description')} />
            </Field>

            <Field label="Images" error={errors.images?.message} hint="First image is the cover. Add alt text for SEO.">
              <Controller
                control={control}
                name="images"
                render={({ field }) => (
                  <ImageUploader value={field.value} onChange={field.onChange} folder="products" altFallback={form.getValues('name')} />
                )}
              />
            </Field>

            <Field label="Tags" htmlFor="tags" hint="Comma-separated, e.g. tree, flowering, tall">
              <Input id="tags" placeholder="tree, flowering, tall" {...register('tags')} />
            </Field>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-gray-50/60 p-4 sm:grid-cols-2">
              <Controller control={control} name="isActive" render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label={field.value ? 'Active' : 'Draft'} description="Active products are visible on the store" />
              )} />
              <Controller control={control} name="isFeatured" render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Featured" description="Show first in listings" />
              )} />
              <Controller control={control} name="isNewArrival" render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="New arrival" description="Show in the homepage new arrivals section" />
              )} />
            </div>
          </div>

          {/* ── SPECIFICATIONS ─────────────────────── */}
          <div className={cn('pt-5', tab !== 'specs' && 'hidden')}>
            <SpecificationsTab form={form} collections={collections} />
          </div>

          {/* ── SEO ─────────────────────────────────── */}
          <div className={cn('pt-5', tab !== 'seo' && 'hidden')}>
            <SeoTab form={form} product={product} storefrontUrl={nav?.store.storefrontUrl} />
          </div>
        </form>
      )}
    </Modal>
  );
}

function tabFor(field: string): Tab {
  if (field.startsWith('spec')) return 'specs';
  if (field.startsWith('seo')) return 'seo';
  return 'general';
}

type FormApi = ReturnType<typeof useForm<ProductFormValues, unknown, ProductFormOutput>>;

function ShortDescriptionField({ form }: { form: FormApi }) {
  const value = useWatch({ control: form.control, name: 'shortDescription' }) || '';
  return (
    <Field
      label="Short description"
      htmlFor="shortDescription"
      error={form.formState.errors.shortDescription?.message}
      counter={{ value: value.length, max: 500 }}
      hint="Plain-text summary used on product cards and by AI assistants."
    >
      <Textarea id="shortDescription" rows={2} placeholder="5.5 ft artificial rhododendron with 1,130 leaves on a wooden trunk." {...form.register('shortDescription')} />
    </Field>
  );
}

/** Specs are shown dynamically: plant fields vs pack fields depending on the collection. */
function SpecificationsTab({ form, collections }: { form: FormApi; collections: { _id: string; name: string }[] }) {
  const { register, control, formState: { errors } } = form;
  const { fields: customSpecFields, append: appendCustomSpec, remove: removeCustomSpec } = useFieldArray({ control, name: 'spec.additionalSpecs' });
  const e = errors.spec;
  const collectionId = useWatch({ control, name: 'collection' });
  const packSize = useWatch({ control, name: 'spec.packSize' });
  const additionalNotes = useWatch({ control, name: 'spec.additionalNotes' }) || '';
  const collectionName = collections.find((c) => c._id === collectionId)?.name ?? '';
  const isPack = /bush|creeper|pack|green\s?wall/i.test(collectionName) || !!packSize;
  const [showAll, setShowAll] = useState(false);

  const plantFields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Height" htmlFor="heightValue" error={e?.heightValue?.message}>
        <div className="flex gap-2">
          <Input id="heightValue" type="number" step="0.01" min={0} placeholder="5.5" invalid={!!e?.heightValue} {...register('spec.heightValue')} />
          <Select aria-label="Height unit" containerClassName="w-24 shrink-0" {...register('spec.heightUnit')}>
            <option value="ft">ft</option>
            <option value="m">m</option>
            <option value="cm">cm</option>
            <option value="in">in</option>
          </Select>
        </div>
      </Field>
      <Field label="Trunk material" htmlFor="trunkMaterial" error={e?.trunkMaterial?.message}>
        <Input id="trunkMaterial" list="trunk-options" placeholder="Wooden / Plastic" {...register('spec.trunkMaterial')} />
        <datalist id="trunk-options"><option value="Wooden" /><option value="Plastic" /><option value="Natural wood" /><option value="Metal" /></datalist>
      </Field>
      <Field label="Leaf count" htmlFor="leavesCount" error={e?.leavesCount?.message}>
        <Input id="leavesCount" type="number" min={0} step="1" placeholder="1130" invalid={!!e?.leavesCount} {...register('spec.leavesCount')} />
      </Field>
      <Field label="Leaf material" htmlFor="leavesMaterial" error={e?.leavesMaterial?.message} hint="PE = polyethylene">
        <Input id="leavesMaterial" list="leaf-options" placeholder="PE" {...register('spec.leavesMaterial')} />
        <datalist id="leaf-options"><option value="PE" /><option value="PU" /><option value="PVC" /><option value="Silk" /><option value="Polyester" /></datalist>
      </Field>
      <Field label="Flowers" htmlFor="flowers" error={e?.flowers?.message} hint="For flowering plants, e.g. orchids">
        <Input id="flowers" type="number" min={0} step="1" placeholder="49" invalid={!!e?.flowers} {...register('spec.flowers')} />
      </Field>
    </div>
  );

  const packFields = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Pack size (pieces)" htmlFor="packSize" error={e?.packSize?.message}>
        <Input id="packSize" type="number" min={1} step="1" placeholder="6" invalid={!!e?.packSize} rightAddon="pcs" {...register('spec.packSize')} />
      </Field>
    </div>
  );

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{isPack ? 'Pack details' : 'Plant details'}</h4>
        {isPack ? packFields : plantFields}
      </section>

      <section>
        <button type="button" onClick={() => setShowAll((s) => !s)} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-700">
          <ChevronDown className={cn('h-4 w-4 transition', showAll && 'rotate-180')} />
          {isPack ? 'Plant details (height, leaves, trunk)' : 'Pack details'}
        </button>
        {showAll && <div className="mt-3">{isPack ? plantFields : packFields}</div>}
      </section>

      <section>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Placement & features</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Suitable for" htmlFor="indoorOutdoor">
            <Select id="indoorOutdoor" {...register('spec.indoorOutdoor')}>
              <option value="">Not specified</option>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="both">Indoor & outdoor</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-border bg-gray-50/60 p-4 sm:grid-cols-3">
          {(['uvResistant', 'fireRetardant', 'potIncluded'] as const).map((k) => (
            <Controller key={k} control={control} name={`spec.${k}`} render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} label={{ uvResistant: 'UV resistant', fireRetardant: 'Fire retardant', potIncluded: 'Pot included' }[k]} />
            )} />
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-ink">Custom specifications</h4>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Add product-specific details such as colour, dimensions, finish or coverage.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => appendCustomSpec({ name: '', value: '' })} disabled={customSpecFields.length >= 20}>
            <Plus className="mr-1.5 h-4 w-4" />Add detail
          </Button>
        </div>
        {customSpecFields.length > 0 ? (
          <div className="mt-4 space-y-3">
            {customSpecFields.map((row, index) => (
              <div key={row.id} className="grid gap-3 rounded-lg border border-border bg-gray-50/60 p-3 sm:grid-cols-[1fr_1.2fr_auto] sm:items-start">
                <Field label="Specification" htmlFor={`custom-spec-name-${row.id}`} error={e?.additionalSpecs?.[index]?.name?.message}>
                  <Input id={`custom-spec-name-${row.id}`} placeholder="Colour" maxLength={60} invalid={!!e?.additionalSpecs?.[index]?.name} {...register(`spec.additionalSpecs.${index}.name` as const)} />
                </Field>
                <Field label="Value" htmlFor={`custom-spec-value-${row.id}`} error={e?.additionalSpecs?.[index]?.value?.message}>
                  <Input id={`custom-spec-value-${row.id}`} placeholder="Dark green" maxLength={200} invalid={!!e?.additionalSpecs?.[index]?.value} {...register(`spec.additionalSpecs.${index}.value` as const)} />
                </Field>
                <button type="button" onClick={() => removeCustomSpec(index)} className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-muted-foreground transition hover:border-red-200 hover:bg-red-50 hover:text-red-700" aria-label={`Remove custom specification ${index + 1}`} title="Remove detail">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-muted-foreground">No custom specifications added.</p>
        )}
        <Field label="Additional specification notes" htmlFor="additional-spec-notes" error={e?.additionalNotes?.message} hint="Use this for longer details or qualifications that do not fit the name/value rows." counter={{ value: additionalNotes.length, max: 2000 }}>
          <Textarea id="additional-spec-notes" rows={4} maxLength={2000} placeholder="Add any extra product details customers should know…" invalid={!!e?.additionalNotes} {...register('spec.additionalNotes')} />
        </Field>
      </section>
    </div>
  );
}

function SeoTab({ form, product, storefrontUrl }: { form: FormApi; product?: Product; storefrontUrl?: string }) {
  const { register, control, formState: { errors } } = form;
  const [name, title = '', desc = '', shortDesc = ''] = useWatch({ control, name: ['name', 'seo.metaTitle', 'seo.metaDescription', 'shortDescription'] });
  const [showLd, setShowLd] = useState(false);

  const preview = useMemo(() => {
    const slug = product?.slug || slugify(name || 'new-product');
    const base = (storefrontUrl || 'https://www.fynesurfaces.com').replace(/^https?:\/\//, '');
    return {
      title: (title || `${name || 'Product name'} | FYNE SURFACES`).slice(0, 70),
      url: `${base} › products › ${slug}`,
      description: (desc || shortDesc || 'Add a meta description to control how this product appears in search results.').slice(0, 170),
    };
  }, [name, title, desc, shortDesc, product?.slug, storefrontUrl]);

  return (
    <div className="space-y-5">
      {/* Google preview */}
      <div className="rounded-xl border border-border p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Globe className="h-3.5 w-3.5" /> Search engine listing preview
        </p>
        <p className="truncate text-xs text-ink-soft">{preview.url}</p>
        <p className="mt-0.5 truncate text-lg leading-snug text-[#1a0dab]">{preview.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{preview.description}</p>
      </div>

      <Field label="Meta title" htmlFor="metaTitle" error={errors.seo?.metaTitle?.message} counter={{ value: title.length, max: 70 }} hint="Defaults to “Product name | FYNE SURFACES”">
        <Input id="metaTitle" placeholder={`${name || 'Rhododendron'} | Artificial Plants | FYNE`} invalid={!!errors.seo?.metaTitle} {...register('seo.metaTitle')} />
      </Field>
      <Field label="Meta description" htmlFor="metaDescription" error={errors.seo?.metaDescription?.message} counter={{ value: desc.length, max: 170 }} hint="Aim for 120–160 characters. Falls back to the short description.">
        <Textarea id="metaDescription" rows={3} invalid={!!errors.seo?.metaDescription} {...register('seo.metaDescription')} />
      </Field>
      <Field label="Keywords" htmlFor="keywords" hint="Comma-separated, e.g. artificial palm tree, tall artificial plants">
        <Input id="keywords" placeholder="artificial palm tree, tall artificial plants india" {...register('seo.keywords')} />
      </Field>

      {/* Server-generated previews (edit mode, reflects last save) */}
      {product?.seoPreview && (
        <div className="space-y-3">
          <div className="rounded-xl border border-secondary-200 bg-secondary-50/50 p-4">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-700">
              <Bot className="h-3.5 w-3.5" /> AI answer-engine summary
            </p>
            <p className="text-sm leading-relaxed text-ink-soft">{product.seoPreview.aiSummary}</p>
          </div>
          <div className="rounded-xl border border-border">
            <button type="button" onClick={() => setShowLd((s) => !s)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-ink-soft">
              <span className="flex items-center gap-2"><Code2 className="h-4 w-4 text-primary" /> Structured data (JSON-LD)</span>
              <ChevronDown className={cn('h-4 w-4 transition', showLd && 'rotate-180')} />
            </button>
            {showLd && (
              <pre className="scrollbar-thin max-h-72 overflow-auto border-t border-border bg-gray-950 p-4 text-[11px] leading-relaxed text-green-300">
                {JSON.stringify(product.seoPreview.jsonLd, null, 2)}
              </pre>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Previews reflect the last saved version.</p>
        </div>
      )}
    </div>
  );
}
