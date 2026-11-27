// Types mirror the FYNE Express API response shapes.

export type Role = 'superadmin' | 'admin' | 'editor';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  createdBy?: { _id: string; name: string; email: string } | null;
}

export interface Session {
  accessToken: string;
  user: User;
  permissions: string[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ListResponse<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: { field: string; message: string }[] | Record<string, unknown>;
}

export interface Image {
  url: string;
  alt?: string;
  publicId?: string;
  unoptimized?: boolean;
}

export interface Seo {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
}

export interface CollectionRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Collection extends CollectionRef {
  description?: string;
  coverImage?: Image;
  seo?: Seo;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  activeProductCount?: number;
  createdAt: string;
  updatedAt: string;
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
  additionalNotes?: string;
  additional?: Record<string, string>;
}

export interface Product {
  _id: string;
  name?: string;
  slug: string;
  sku: string;
  collection: CollectionRef | string;
  price: number;
  compareAtPrice?: number;
  shortDescription?: string;
  description?: string;
  specifications?: Specifications;
  images: Image[];
  stock: number;
  lowStockThreshold?: number;
  tags?: string[];
  faqs?: { question: string; answer: string }[];
  seo?: Seo;
  isActive: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  thumbnail?: string | null;
  inventoryStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
  seoPreview?: {
    google: { title: string; url: string; description: string };
    aiSummary: string;
    jsonLd: unknown;
  };
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export interface Address {
  fullName?: string;
  phone?: string;
  phoneNumber?: string;
  line1?: string;
  line2?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode?: string;
  pincode?: string;
  country?: string;
  addressType?: 'Home' | 'Work';
}

export interface OrderItem {
  product: string | { _id: string; slug: string; stock: number };
  name: string;
  sku: string;
  image?: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface OrderListItem {
  _id: string;
  orderNumber: number;
  user?: { _id: string; name: string; email: string } | null;
  email: string;
  totalAmount: number;
  currency: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'online' | 'cod' | 'bank_transfer';
  itemCount?: number;
  createdAt: string;
}

export interface Order extends OrderListItem {
  user: { _id: string; name: string; email: string; phone?: string; ordersCount?: number; totalSpent?: number } | null;
  orderItems: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  discount?: { code?: string; amount: number };
  shippingFee: number;
  tax: { amount: number; rate: number; included: boolean };
  gatewayTransactionId?: string;
  paymentProvider?: string;
  tracking?: { carrier?: string; number?: string; url?: string };
  notes?: string;
  history: { type: string; status?: string; note?: string; by?: { name: string } | null; at: string }[];
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface DashboardData {
  range: { from: string; to: string; timezone: string };
  stats: {
    totalProducts: number;
    activeProducts: number;
    outOfStockProducts: number;
    lowStockCount: number;
    inventoryValue: number;
    totalRevenue?: number;
    totalOrders?: number;
    paidOrders?: number;
    averageOrderValue?: number;
    ordersToFulfill?: number;
    totalCustomers?: number;
    newLeads?: number;
    sessions?: number;
    conversionRate?: number;
    liveVisitors?: number;
  };
  changes?: { revenue: number; orders: number; sessions?: number };
  lowStockAlerts: { _id: string; name: string; sku: string; stock: number; threshold: number; thumbnail: string | null; severity: 'critical' | 'warning' }[];
  ordersByStatus?: Partial<Record<OrderStatus, number>>;
  topProducts?: { _id: string; name: string; sku: string; unitsSold: number; revenue: number }[];
  recentOrders?: { _id: string; orderNumber: number; email: string; totalAmount: number; orderStatus: OrderStatus; paymentStatus: PaymentStatus; createdAt: string }[];
  salesOverTime?: { date: string; revenue: number; orders: number; sessions: number }[];
}

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  path: string;
}

export type SearchResults = Partial<Record<'products' | 'collections' | 'orders' | 'customers' | 'content', SearchResultItem[]>>;

export interface NavigationData {
  store: { name: string; tagline: string; logo: string | null; storefrontUrl: string };
  badges: Partial<Record<'ordersToFulfill' | 'lowStock' | 'newLeads', number>>;
}
