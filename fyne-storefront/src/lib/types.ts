// Shapes returned by the FYNE backend's public /api/v1/store/* endpoints.

export interface StoreImage {
  url: string;
  alt?: string;
  publicId?: string;
}

export interface Attribute {
  key: string;
  name: string;
  value: string | number;
  unit?: string;
  display: string;
}

export interface Breadcrumb {
  name: string;
  url: string;
}

export interface Specifications {
  height?: { value?: number; unit?: 'ft' | 'm' | 'cm' | 'in' };
  leaves?: { count?: number; material?: string };
  trunkMaterial?: string;
  flowers?: number;
  packSize?: number;
  potIncluded?: boolean;
  uvResistant?: boolean;
  fireRetardant?: boolean;
  indoorOutdoor?: 'indoor' | 'outdoor' | 'both';
}

/** /store/products list item (AEO presenter, no JSON-LD). */
export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  sku: string;
  url: string;
  brand: string;
  collection: { id: string; name: string; slug: string; url: string } | null;
  price: { amount: number; currency: 'INR'; formatted: string; compareAt: number | null; taxIncluded: boolean | null };
  availability: { inStock: boolean; status: 'InStock' | 'OutOfStock' };
  summary: string;
  shortDescription: string;
  descriptionHtml: string;
  descriptionText: string;
  specifications: Specifications;
  attributes: Attribute[];
  facts: Record<string, string | number | boolean>;
  images: StoreImage[];
  tags: string[];
  faqs: { question: string; answer: string }[];
  isFeatured: boolean;
  seo: { title: string; description: string; keywords: string[]; canonicalUrl: string };
  breadcrumbs: Breadcrumb[];
  updatedAt: string;
}

/** /store/products/:slug */
export interface ProductDetail extends ProductSummary {
  jsonLd: Record<string, unknown>;
  related: { name: string; slug: string; sku: string; url: string; price: number; image: string | null; inStock: boolean }[];
}

export interface CollectionSummary {
  id: string;
  name: string;
  slug: string;
  url: string;
  description: string;
  coverImage: StoreImage | null;
  productCount: number;
}

export interface CollectionDetail {
  id: string;
  name: string;
  slug: string;
  url: string;
  descriptionHtml: string;
  coverImage: StoreImage | null;
  seo: { title: string; description: string; canonicalUrl: string };
  products: ProductSummary[];
  jsonLd: Record<string, unknown>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  logo: StoreImage | null;
  contact?: { email?: string; phone?: string; whatsapp?: string; address?: string };
  currency: string;
  social?: Record<string, string | undefined>;
  tax: { pricesIncludeTax: boolean };
  shipping: { flatRate: number; freeShippingThreshold: number };
  seo?: { defaultMetaTitle?: string; defaultMetaDescription?: string };
  organizationJsonLd: Record<string, unknown>;
}

export interface ContentPage {
  _id: string;
  title: string;
  slug: string;
  body?: string;
  excerpt?: string;
  url: string;
  seo: { title: string; description: string; canonicalUrl: string };
  jsonLd: Record<string, unknown>;
  updatedAt: string;
}
