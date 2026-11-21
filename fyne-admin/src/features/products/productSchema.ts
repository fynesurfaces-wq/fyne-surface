import { z } from 'zod';
import type { Product } from '@/lib/types';
import { splitList } from '@/lib/utils';

/**
 * Form schema mirrors the backend Mongoose Product model + express-validator
 * rules (src/validators/catalog.validators.js). Optional numbers are kept as
 * strings in the form ('' = not set) and converted in toPayload().
 */
const optionalNumber = (opts: { int?: boolean; min?: number; max?: number; label: string }) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || !Number.isNaN(Number(v)), `${opts.label} must be a number`)
    .refine((v) => v === '' || !opts.int || Number.isInteger(Number(v)), `${opts.label} must be a whole number`)
    .refine((v) => v === '' || opts.min === undefined || Number(v) >= opts.min, `${opts.label} must be ≥ ${opts.min}`)
    .refine((v) => v === '' || opts.max === undefined || Number(v) <= opts.max, `${opts.label} must be ≤ ${opts.max}`);

export const productSchema = z
  .object({
    // General
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
    sku: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{3,30}$/, 'SKU: 3–30 letters, numbers or dashes (e.g. FYN104E)')
      .transform((v) => v.toUpperCase()),
    collection: z.string().min(1, 'Choose a collection'),
    // Registered with valueAsNumber → empty input arrives as NaN and is rejected (never silently 0).
    price: z.number({ invalid_type_error: 'Enter a price', required_error: 'Enter a price' }).min(0, 'Price cannot be negative').max(100_000_000),
    compareAtPrice: optionalNumber({ min: 0, label: 'Compare-at price' }),
    stock: z.number({ invalid_type_error: 'Enter stock quantity', required_error: 'Enter stock quantity' }).int('Whole numbers only').min(0, 'Stock cannot be negative'),
    lowStockThreshold: optionalNumber({ int: true, min: 0, label: 'Threshold' }),
    shortDescription: z.string().max(500, 'Max 500 characters'),
    description: z.string().max(20000),
    tags: z.string(),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    images: z.array(z.object({ url: z.string().url(), alt: z.string().max(160).optional(), publicId: z.string().optional() })).max(20),

    // Specifications
    spec: z.object({
      heightValue: optionalNumber({ min: 0, max: 100, label: 'Height' }),
      heightUnit: z.enum(['ft', 'm', 'cm', 'in']),
      leavesCount: optionalNumber({ int: true, min: 0, label: 'Leaf count' }),
      leavesMaterial: z.string().max(40),
      trunkMaterial: z.string().max(60),
      flowers: optionalNumber({ int: true, min: 0, label: 'Flowers' }),
      packSize: optionalNumber({ int: true, min: 1, label: 'Pack size' }),
      indoorOutdoor: z.enum(['', 'indoor', 'outdoor', 'both']),
      uvResistant: z.boolean(),
      fireRetardant: z.boolean(),
      potIncluded: z.boolean(),
    }),

    // SEO
    seo: z.object({
      metaTitle: z.string().max(70, 'Keep meta titles ≤ 70 characters'),
      metaDescription: z.string().max(170, 'Keep meta descriptions ≤ 170 characters'),
      keywords: z.string(),
    }),
  })
  .refine((v) => v.compareAtPrice === '' || Number(v.compareAtPrice) >= v.price, {
    path: ['compareAtPrice'],
    message: 'Compare-at price should be higher than the price',
  });

export type ProductFormValues = z.input<typeof productSchema>;
export type ProductFormOutput = z.output<typeof productSchema>;

export const emptyProduct = (collection = ''): ProductFormValues => ({
  name: '',
  sku: '',
  collection,
  price: undefined as unknown as number,
  compareAtPrice: '',
  stock: 0,
  lowStockThreshold: '',
  shortDescription: '',
  description: '',
  tags: '',
  isActive: true,
  isFeatured: false,
  images: [],
  spec: { heightValue: '', heightUnit: 'ft', leavesCount: '', leavesMaterial: '', trunkMaterial: '', flowers: '', packSize: '', indoorOutdoor: '', uvResistant: false, fireRetardant: false, potIncluded: false },
  seo: { metaTitle: '', metaDescription: '', keywords: '' },
});

const str = (n?: number | null) => (n === undefined || n === null ? '' : String(n));

/** API product → form values */
export function toFormValues(p: Product): ProductFormValues {
  const s = p.specifications || {};
  return {
    name: p.name,
    sku: p.sku,
    collection: typeof p.collection === 'string' ? p.collection : p.collection?._id ?? '',
    price: p.price,
    compareAtPrice: str(p.compareAtPrice),
    stock: p.stock,
    lowStockThreshold: str(p.lowStockThreshold),
    shortDescription: p.shortDescription || '',
    description: p.description || '',
    tags: (p.tags || []).join(', '),
    isActive: p.isActive,
    isFeatured: !!p.isFeatured,
    images: p.images || [],
    spec: {
      heightValue: str(s.height?.value),
      heightUnit: s.height?.unit || 'ft',
      leavesCount: str(s.leaves?.count),
      leavesMaterial: s.leaves?.material || '',
      trunkMaterial: s.trunkMaterial || '',
      flowers: str(s.flowers),
      packSize: str(s.packSize),
      indoorOutdoor: s.indoorOutdoor || '',
      uvResistant: !!s.uvResistant,
      fireRetardant: !!s.fireRetardant,
      potIncluded: !!s.potIncluded,
    },
    seo: { metaTitle: p.seo?.metaTitle || '', metaDescription: p.seo?.metaDescription || '', keywords: (p.seo?.keywords || []).join(', ') },
  };
}

const num = (v: string) => (v === '' ? undefined : Number(v));

/** Form values → API payload (matches the backend's FIELDS whitelist). */
export function toPayload(v: ProductFormOutput) {
  const s = v.spec;
  const specifications: Record<string, unknown> = {
    ...(s.heightValue !== '' && { height: { value: num(s.heightValue), unit: s.heightUnit } }),
    ...((s.leavesCount !== '' || s.leavesMaterial) && {
      leaves: { ...(s.leavesCount !== '' && { count: num(s.leavesCount) }), ...(s.leavesMaterial && { material: s.leavesMaterial.trim() }) },
    }),
    ...(s.trunkMaterial && { trunkMaterial: s.trunkMaterial.trim() }),
    ...(s.flowers !== '' && { flowers: num(s.flowers) }),
    ...(s.packSize !== '' && { packSize: num(s.packSize) }),
    ...(s.indoorOutdoor && { indoorOutdoor: s.indoorOutdoor }),
    // Only send features that are ON — omitted keys are unset (specs are replaced as a whole),
    // so unchecked boxes don't publish "Pot included: No" into the JSON-LD.
    ...(s.uvResistant && { uvResistant: true }),
    ...(s.fireRetardant && { fireRetardant: true }),
    ...(s.potIncluded && { potIncluded: true }),
  };
  return {
    name: v.name,
    sku: v.sku,
    collection: v.collection,
    price: v.price,
    compareAtPrice: num(v.compareAtPrice) ?? null,
    stock: v.stock,
    lowStockThreshold: num(v.lowStockThreshold) ?? null,
    shortDescription: v.shortDescription.trim(),
    description: v.description.trim(),
    tags: splitList(v.tags).map((t) => t.toLowerCase()),
    isActive: v.isActive,
    isFeatured: v.isFeatured,
    images: v.images.map((i) => ({ url: i.url, ...(i.alt && { alt: i.alt }), ...(i.publicId && { publicId: i.publicId }) })),
    specifications,
    seo: {
      ...(v.seo.metaTitle.trim() && { metaTitle: v.seo.metaTitle.trim() }),
      ...(v.seo.metaDescription.trim() && { metaDescription: v.seo.metaDescription.trim() }),
      keywords: splitList(v.seo.keywords).map((k) => k.toLowerCase()),
    },
  };
}

/** Map backend 422 field paths → form field names (for inline errors). */
export const API_FIELD_MAP: Record<string, string> = {
  'specifications.height.value': 'spec.heightValue',
  'specifications.height.unit': 'spec.heightUnit',
  'specifications.leaves.count': 'spec.leavesCount',
  'specifications.leaves.material': 'spec.leavesMaterial',
  'specifications.trunkMaterial': 'spec.trunkMaterial',
  'specifications.flowers': 'spec.flowers',
  'specifications.packSize': 'spec.packSize',
  'specifications.indoorOutdoor': 'spec.indoorOutdoor',
};

/** Which tab each field lives on (to show error dots on tabs). */
export const TAB_FIELDS = {
  general: ['name', 'sku', 'collection', 'price', 'compareAtPrice', 'stock', 'lowStockThreshold', 'shortDescription', 'description', 'tags', 'images'],
  specs: ['spec'],
  seo: ['seo'],
} as const;
