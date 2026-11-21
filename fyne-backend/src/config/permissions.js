'use strict';

/**
 * RBAC — single source of truth.
 *
 * Routes never check roles directly; they check PERMISSIONS. Roles are just
 * named bundles of permissions. To change what a role can do, edit
 * ROLE_PERMISSIONS below — no controller changes needed.
 */

const ROLES = Object.freeze({
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  EDITOR: 'editor',
});

const P = Object.freeze({
  DASHBOARD_VIEW: 'dashboard:view',

  PRODUCTS_READ: 'products:read',
  PRODUCTS_CREATE: 'products:create',
  PRODUCTS_UPDATE: 'products:update',
  PRODUCTS_DELETE: 'products:delete',

  COLLECTIONS_READ: 'collections:read',
  COLLECTIONS_CREATE: 'collections:create',
  COLLECTIONS_UPDATE: 'collections:update',
  COLLECTIONS_DELETE: 'collections:delete',

  ORDERS_READ: 'orders:read',
  ORDERS_UPDATE: 'orders:update', // fulfil / ship / cancel

  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_WRITE: 'customers:write',

  DISCOUNTS_READ: 'discounts:read',
  DISCOUNTS_WRITE: 'discounts:write',

  CONTENT_READ: 'content:read',
  CONTENT_WRITE: 'content:write',

  MARKETS_READ: 'markets:read',
  MARKETS_WRITE: 'markets:write',

  LEADS_READ: 'leads:read',
  LEADS_WRITE: 'leads:write',

  ANALYTICS_VIEW: 'analytics:view',
  GROWTH_VIEW: 'growth:view',

  CHANNELS_READ: 'channels:read',
  CHANNELS_WRITE: 'channels:write',

  APPS_MANAGE: 'apps:manage',

  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  MEDIA_UPLOAD: 'media:upload',
  MEDIA_DELETE: 'media:delete',

  USERS_MANAGE: 'users:manage', // staff accounts (superadmin only)
});

const ROLE_PERMISSIONS = Object.freeze({
  // Full access, including staff management.
  [ROLES.SUPERADMIN]: Object.values(P),

  // Manages catalog + store operations, VIEWS orders, cannot manage staff.
  [ROLES.ADMIN]: [
    P.DASHBOARD_VIEW,
    P.PRODUCTS_READ, P.PRODUCTS_CREATE, P.PRODUCTS_UPDATE, P.PRODUCTS_DELETE,
    P.COLLECTIONS_READ, P.COLLECTIONS_CREATE, P.COLLECTIONS_UPDATE, P.COLLECTIONS_DELETE,
    P.ORDERS_READ,
    // P.ORDERS_UPDATE,  ← uncomment to let admins fulfil/ship/cancel orders
    P.CUSTOMERS_READ, P.CUSTOMERS_WRITE,
    P.DISCOUNTS_READ, P.DISCOUNTS_WRITE,
    P.CONTENT_READ, P.CONTENT_WRITE,
    P.MARKETS_READ,
    P.LEADS_READ, P.LEADS_WRITE,
    P.ANALYTICS_VIEW, P.GROWTH_VIEW,
    P.CHANNELS_READ,
    P.SETTINGS_READ,
    P.MEDIA_UPLOAD, P.MEDIA_DELETE,
  ],

  // Catalog content only: create/update products & collections. No orders, no user data.
  [ROLES.EDITOR]: [
    P.DASHBOARD_VIEW,
    P.PRODUCTS_READ, P.PRODUCTS_CREATE, P.PRODUCTS_UPDATE,
    P.COLLECTIONS_READ, P.COLLECTIONS_CREATE, P.COLLECTIONS_UPDATE,
    P.MEDIA_UPLOAD,
  ],
});

const permissionSets = Object.fromEntries(
  Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => [role, new Set(perms)])
);

const hasPermission = (role, permission) => Boolean(permissionSets[role]?.has(permission));
const permissionsFor = (role) => [...(permissionSets[role] || [])];

module.exports = { ROLES, P, ROLE_PERMISSIONS, hasPermission, permissionsFor };
