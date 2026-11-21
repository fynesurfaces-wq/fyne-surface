'use strict';

/**
 * Admin sidebar definition — mirrors the Shopify admin layout.
 *
 * The frontend renders the sidebar from GET /api/v1/admin/navigation, which
 * filters this tree by the current user's permissions and attaches live badge
 * counts (e.g. unfulfilled orders). Adding a page = adding an entry here.
 *
 * `icon` values are Lucide icon names (https://lucide.dev) — swap freely.
 * `badge` refers to a key computed in navigation.controller.js.
 */
const { P } = require('./permissions');

const NAVIGATION = [
  {
    section: 'main',
    items: [
      { key: 'home', label: 'Home', icon: 'house', path: '/', permission: P.DASHBOARD_VIEW },
      {
        key: 'orders', label: 'Orders', icon: 'inbox', path: '/orders', permission: P.ORDERS_READ, badge: 'ordersToFulfill',
        children: [
          { key: 'orders-all', label: 'All orders', path: '/orders', permission: P.ORDERS_READ },
          { key: 'orders-abandoned', label: 'Abandoned checkouts', path: '/orders/abandoned', permission: P.GROWTH_VIEW },
        ],
      },
      {
        key: 'products', label: 'Products', icon: 'tag', path: '/products', permission: P.PRODUCTS_READ,
        children: [
          { key: 'products-all', label: 'All products', path: '/products', permission: P.PRODUCTS_READ },
          { key: 'collections', label: 'Collections', path: '/collections', permission: P.COLLECTIONS_READ },
          { key: 'inventory', label: 'Inventory', path: '/products/inventory', permission: P.PRODUCTS_READ, badge: 'lowStock' },
        ],
      },
      {
        key: 'customers', label: 'Customers', icon: 'user', path: '/customers', permission: P.CUSTOMERS_READ,
        children: [
          { key: 'customers-all', label: 'All customers', path: '/customers', permission: P.CUSTOMERS_READ },
          { key: 'customers-segments', label: 'Segments', path: '/customers/segments', permission: P.CUSTOMERS_READ },
        ],
      },
      {
        key: 'growth', label: 'Growth', icon: 'trending-up', path: '/growth', permission: P.GROWTH_VIEW,
        children: [
          { key: 'growth-overview', label: 'Overview', path: '/growth', permission: P.GROWTH_VIEW },
          { key: 'growth-abandoned', label: 'Abandoned checkouts', path: '/growth/abandoned-checkouts', permission: P.GROWTH_VIEW },
          { key: 'growth-audience', label: 'Marketing audience', path: '/growth/audience', permission: P.GROWTH_VIEW },
        ],
      },
      { key: 'discounts', label: 'Discounts', icon: 'badge-percent', path: '/discounts', permission: P.DISCOUNTS_READ },
      {
        key: 'content', label: 'Content', icon: 'file-text', path: '/content', permission: P.CONTENT_READ,
        children: [
          { key: 'content-pages', label: 'Pages', path: '/content/pages', permission: P.CONTENT_READ },
          { key: 'content-blog', label: 'Blog posts', path: '/content/blog', permission: P.CONTENT_READ },
          { key: 'content-files', label: 'Files', path: '/content/files', permission: P.MEDIA_UPLOAD },
        ],
      },
      { key: 'markets', label: 'Markets', icon: 'globe', path: '/markets', permission: P.MARKETS_READ },
      {
        key: 'analytics', label: 'Analytics', icon: 'bar-chart-3', path: '/analytics', permission: P.ANALYTICS_VIEW,
        children: [
          { key: 'analytics-overview', label: 'Overview', path: '/analytics', permission: P.ANALYTICS_VIEW },
          { key: 'analytics-reports', label: 'Reports', path: '/analytics/reports', permission: P.ANALYTICS_VIEW },
          { key: 'analytics-live', label: 'Live View', path: '/analytics/live', permission: P.ANALYTICS_VIEW },
        ],
      },
      { key: 'leads', label: 'Leads', icon: 'contact', path: '/leads', permission: P.LEADS_READ, badge: 'newLeads' },
    ],
  },
  {
    section: 'salesChannels',
    label: 'Sales channels',
    path: '/channels',
    permission: P.CHANNELS_READ,
    items: [
      { key: 'channel-agentic', label: 'Agentic', icon: 'bot', path: '/channels/agentic', permission: P.CHANNELS_READ },
      {
        key: 'channel-online-store', label: 'Online Store', icon: 'store', path: '/channels/online-store', permission: P.CHANNELS_READ,
        children: [
          { key: 'os-preferences', label: 'Preferences (SEO)', path: '/channels/online-store/preferences', permission: P.SETTINGS_READ },
          { key: 'os-pages', label: 'Pages', path: '/content/pages', permission: P.CONTENT_READ },
          { key: 'os-blog', label: 'Blog posts', path: '/content/blog', permission: P.CONTENT_READ },
        ],
      },
    ],
  },
  {
    section: 'apps',
    label: 'Apps',
    path: '/apps',
    permission: P.APPS_MANAGE,
    items: [{ key: 'apps-all', label: 'Installed apps', icon: 'blocks', path: '/apps', permission: P.APPS_MANAGE }],
  },
  {
    section: 'footer',
    items: [
      { key: 'settings', label: 'Settings', icon: 'settings', path: '/settings', permission: P.SETTINGS_READ },
      { key: 'staff', label: 'Users & permissions', icon: 'shield', path: '/settings/users', permission: P.USERS_MANAGE },
    ],
  },
];

module.exports = { NAVIGATION };
