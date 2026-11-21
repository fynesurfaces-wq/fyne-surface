import type { Role } from './types';

/**
 * Route access rules for the admin. Permissions come from the API
 * (/auth/login, /auth/refresh, /auth/me) and mirror the backend RBAC matrix,
 * so the UI and API never disagree.
 *
 * IMPORTANT: this is UX, not security — every API route is independently
 * protected server-side.
 */
export const P = {
  DASHBOARD: 'dashboard:view',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',
  COLLECTIONS_READ: 'collections:read',
  COLLECTIONS_CREATE: 'collections:create',
  COLLECTIONS_UPDATE: 'collections:update',
  COLLECTIONS_DELETE: 'collections:delete',
  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update',
  USERS_MANAGE: 'users:manage',
  MEDIA_UPLOAD: 'media:upload',
} as const;

/** Longest-prefix match wins. */
export const ROUTE_RULES: { prefix: string; permission: string }[] = [
  { prefix: '/dashboard/users', permission: P.USERS_MANAGE },
  { prefix: '/dashboard/orders', permission: P.ORDERS_READ },
  { prefix: '/dashboard/collections', permission: P.COLLECTIONS_READ },
  { prefix: '/dashboard/products', permission: P.PRODUCTS_READ },
  { prefix: '/dashboard', permission: P.DASHBOARD },
];

export function requiredPermission(pathname: string) {
  return ROUTE_RULES.filter((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0]?.permission;
}

/** Where to send someone who hit a page they can't see. */
export function fallbackRoute(role: Role | undefined, permissions: string[]) {
  if (role === 'editor') return '/dashboard/products';
  return permissions.includes(P.DASHBOARD) ? '/dashboard' : '/dashboard/products';
}

export const ROLE_LABEL: Record<Role, string> = { superadmin: 'Super Admin', admin: 'Admin', editor: 'Editor' };
