# FYNE SURFACES — Admin Dashboard Architecture (Shopify-style)

This document specifies the admin UI to be built on top of this backend. It covers the layout, every sidebar section and the APIs it uses, the auth flow, RBAC in the UI, data tables, modals, and theming.

---

## 1. Recommended frontend stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **React 18 + Vite** (admin is a private SPA; SEO irrelevant) | Fast dev, simple deploy to `admin.fynesurfaces.com` |
| Server state | **TanStack Query** | Caching, refetch, optimistic updates, pagination |
| Tables | **TanStack Table** (headless) | Server-side sort / filter / pagination |
| Forms | **React Hook Form + Zod** | Mirrors backend validation; shows 422 field errors inline |
| Rich text | **TipTap** | Outputs HTML; backend sanitises it (allow-list) |
| UI | **Tailwind CSS + shadcn/ui (Radix)** | Accessible primitives: Dialog, Sheet, Dropdown, Command (Ctrl K) |
| Charts | **Recharts** | Sales over time, sessions sparkline |
| Icons | **lucide-react** | Icon names are already in `src/config/navigation.js` |
| HTTP | `fetch` wrapper (or axios) with `credentials: 'include'` | Required for the HttpOnly refresh cookie |

The public storefront should be a separate **Next.js** app, since it needs SSR for SEO. It uses `/api/v1/store/*` and proxies `/sitemap.xml`, `/robots.txt` and `/llms.txt`.

---

## 2. App shell

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ TOPBAR  [≡] FYNE logo   [🔍 Search            Ctrl K]     [🔔] [Store ↗] [👤 ▾]│
├──────────────────┬────────────────────────────────────────────────────────────┤
│ SIDEBAR          │  PAGE HEADER   Title · breadcrumbs · primary action button │
│  Home            │ ─────────────────────────────────────────────────────────── │
│  Orders      (4) │                                                            │
│  Products        │   PAGE CONTENT                                             │
│  Customers       │   (stat cards / data table / form / detail view)           │
│  Growth          │                                                            │
│  Discounts       │                                                            │
│  Content         │                                                            │
│  Markets         │                                                            │
│  Analytics       │                                                            │
│  Leads       (2) │                                                            │
│                  │                                                            │
│ Sales channels › │                                                            │
│  Agentic         │                                                            │
│  Online Store    │                                                            │
│                  │                                                            │
│ Apps ›           │                                                            │
│                  │                                                            │
│  Settings        │                                                            │
│  [FYNE store 🔔] │                                                            │
└──────────────────┴────────────────────────────────────────────────────────────┘
```

**Sidebar.** The sidebar is rendered entirely from `GET /api/v1/admin/navigation`. The backend has already filtered it by the user's permissions and attached badge counts (`ordersToFulfill`, `lowStock`, `newLeads`). The frontend never hard-codes which items a role can see. Refetch it every 60 s and after mutations that change badges (fulfil order, update lead). The sidebar collapses to icons at ≤1280 px and becomes a slide-over `Sheet` on mobile.

**Topbar.**
- **Search (Ctrl K / ⌘K):** a shadcn `CommandDialog` with a 250 ms debounce calling `GET /admin/search?q=`. It renders the groups returned (products, collections, orders, customers, content) and each result links to its `path`.
- **Notifications:** derived from the navigation `badges` (e.g. "4 orders to fulfil", "3 products low on stock").
- **View store ↗:** opens `store.storefrontUrl` from the navigation payload.
- **User menu:** name and role, *Change password* (`PATCH /auth/password`), *Log out* (`POST /auth/logout`).

---

## 3. Sidebar sections → routes → APIs → permission

| Sidebar | Frontend route | Backend endpoints | Permission |
|---|---|---|---|
| **Home** | `/` | `GET /admin/analytics/dashboard?from&to` | `dashboard:view` |
| **Orders** | `/orders`, `/orders/:id` | `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status` | `orders:read` / `orders:update` |
| ↳ Abandoned checkouts | `/orders/abandoned` | `GET /admin/growth/abandoned-checkouts` | `growth:view` |
| **Products** | `/products`, `/products/new`, `/products/:id` | `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id`, `PATCH /admin/products/bulk` | `products:*` |
| ↳ Collections | `/collections`, `/collections/:id` | `GET/POST /admin/collections`, `GET/PATCH/DELETE /admin/collections/:id` | `collections:*` |
| ↳ Inventory | `/products/inventory` | `GET /admin/products?stockStatus=low_stock`, `PATCH /admin/products/:id/inventory` | `products:read/update` |
| **Customers** | `/customers`, `/customers/:id` | `GET /admin/customers?segment=`, `GET /admin/customers/segments`, `GET/PATCH /admin/customers/:id` | `customers:read/write` |
| **Growth** | `/growth`, `/growth/abandoned-checkouts`, `/growth/audience` | `GET /admin/growth/overview`, `GET /admin/growth/abandoned-checkouts`, `GET /admin/customers?segment=subscribers` | `growth:view` |
| **Discounts** | `/discounts`, `/discounts/new`, `/discounts/:id` | `GET/POST /admin/discounts`, `GET/PATCH/DELETE /admin/discounts/:id` | `discounts:read/write` |
| **Content** → Pages / Blog | `/content/pages`, `/content/blog`, `…/:id` | `GET /admin/content?type=page\|blog_post`, `POST`, `GET/PATCH/DELETE /admin/content/:id` | `content:read/write` |
| ↳ Files | `/content/files` | `GET/POST /admin/media`, `PATCH/DELETE /admin/media/:id` | `media:upload/delete` |
| **Markets** | `/markets` | `GET/POST /admin/markets`, `PATCH/DELETE /admin/markets/:id` | `markets:read/write` |
| **Analytics** | `/analytics`, `/analytics/reports`, `/analytics/live` | `GET /admin/analytics/dashboard`, `GET /admin/analytics/reports/sales-by-collection`, `GET /admin/analytics/live` | `analytics:view` |
| **Leads** | `/leads`, `/leads/:id` | `GET /admin/leads?status=`, `GET/PATCH/DELETE /admin/leads/:id`, `POST /admin/leads/:id/notes` | `leads:read/write` |
| **Sales channels › Agentic** | `/channels/agentic` | `GET /admin/channels`, `PATCH /admin/channels/agentic` | `channels:read/write` |
| **Sales channels › Online Store** | `/channels/online-store` (+ Preferences) | `GET /admin/channels`, `PATCH /admin/channels/online-store`, `GET/PATCH /admin/settings` (SEO defaults) | `channels:*`, `settings:*` |
| **Apps** | `/apps` | `GET/POST /admin/apps`, `PATCH/DELETE /admin/apps/:id` | `apps:manage` |
| **Settings** | `/settings` (General, Taxes, Shipping, Brand) | `GET/PATCH /admin/settings` | `settings:read/write` |
| ↳ Users & permissions | `/settings/users` | `GET/POST /admin/users`, `PATCH /admin/users/:id/role`, `PATCH /admin/users/:id/status`, `DELETE /admin/users/:id`, `GET /admin/users/roles` | `users:manage` (superadmin) |

---

## 4. Authentication flow (dual token)

```
Login form ── POST /auth/login {email,password} (credentials:'include')
          ◄── 200 { accessToken, user, permissions }  + Set-Cookie: fyne_rt (HttpOnly, Secure, SameSite=Strict, path=/api/v1/auth)

Store accessToken IN MEMORY ONLY (React context / Zustand) — never localStorage.

Every API call:  Authorization: Bearer <accessToken>

On 401 with error.code === 'TOKEN_EXPIRED':
   → POST /auth/refresh (cookie sent automatically) → new accessToken (cookie rotated)
   → retry the original request once
On refresh failure (REFRESH_INVALID / REFRESH_REUSED / ACCOUNT_DISABLED): clear state → /login

App boot / page reload (memory was wiped):
   → POST /auth/refresh silently → if 200 you're logged in, else show /login
```

**Single-flight refresh.** When several requests fail at once, only one refresh call should run:

```ts
let refreshing: Promise<string> | null = null;

export async function api(path: string, init: RequestInit = {}, retry = true) {
  const res = await fetch(`${API}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token() && { Authorization: `Bearer ${token()}` }), ...init.headers },
  });
  if (res.status === 401 && retry) {
    const { error } = await res.clone().json();
    if (error?.code === 'TOKEN_EXPIRED') {
      refreshing ??= fetch(`${API}/api/v1/auth/refresh`, { method: 'POST', credentials: 'include' })
        .then(r => (r.ok ? r.json() : Promise.reject(r)))
        .then(({ data }) => { setSession(data); return data.accessToken; })
        .finally(() => { refreshing = null; });
      await refreshing.catch(() => logoutLocally());
      return api(path, init, false);
    }
  }
  const body = await res.json();
  if (!res.ok) throw body.error; // { code, message, details? }
  return body;
}
```

**Cookie note.** `SameSite=Strict` works when the admin and API are on the same site, e.g. `admin.fynesurfaces.com` and `api.fynesurfaces.com`. In local development, run the admin on `localhost:5173` and the API on `localhost:5000`; those count as the same site.

---

## 5. RBAC in the UI

`/auth/login`, `/auth/refresh` and `/auth/me` all return `permissions: string[]`.

```tsx
const can = (p: string) => session.permissions.includes(p);
<Can permission="products:delete"><Button variant="destructive">Delete</Button></Can>
```

- Routes are guarded with `<RequirePermission permission="orders:read">`, which renders a 403 page otherwise.
- Hide, rather than disable, actions the user can't take. Examples: the Delete button for editors, the fulfil/ship controls for admins (who only have `orders:read` by default), and the Users page for non-superadmins.
- The backend enforces every rule anyway. The UI checks are for user experience only.

| | superadmin | admin | editor |
|---|:-:|:-:|:-:|
| Products / Collections create & edit | ✅ | ✅ | ✅ |
| Products / Collections delete | ✅ | ✅ | ❌ |
| View orders | ✅ | ✅ | ❌ |
| Fulfil / ship / cancel orders | ✅ | ❌ (toggle in `permissions.js`) | ❌ |
| Customers, Leads, Discounts, Content, Growth, Analytics | ✅ | ✅ | ❌ |
| Markets edit, Apps, Settings edit, Channels edit | ✅ | read-only / ❌ | ❌ |
| Staff users | ✅ | ❌ | ❌ |

---

## 6. Home (dashboard)

Layout, modelled on the Shopify home:

```
[ Date range ▾  Last 30 days · All channels ]
┌ Sessions ─┬ Total sales ─┬ Orders ─┬ Conversion rate ─┬ Live visitors ● ┐   ← metrics bar
│ 17.1K ↘69%│ ₹173.5K  ~~ │ 6   ~~  │ 0.03%            │ 1                │
└───────────┴──────────────┴─────────┴──────────────────┴──────────────────┘
              [ Fulfil orders  4 ]   [ 3 products low on stock ]              ← action chips

┌ Sales over time (line/area: revenue + orders, toggle sessions) ──────────┐
└──────────────────────────────────────────────────────────────────────────┘
┌ Stat cards ──────────────────────────────────────────────────────────────┐
│ Total Revenue │ Total Orders │ Total Products │ Low Stock Alerts │ AOV   │
└──────────────────────────────────────────────────────────────────────────┘
┌ Top products (5) ─────────────┐ ┌ Low-stock alerts (table, inline +stock)┐
└───────────────────────────────┘ └────────────────────────────────────────┘
┌ Recent orders (5) ───────────────────────────────────────────────────────┐
```

All of it comes from one call: `GET /admin/analytics/dashboard?from=2026-08-01&to=2026-08-31`.

| UI element | Response field |
|---|---|
| Sessions + % change | `stats.sessions`, `changes.sessions` |
| Total sales | `stats.totalRevenue`, `changes.revenue` |
| Orders | `stats.totalOrders`, `changes.orders` |
| Conversion rate | `stats.conversionRate` (%) |
| Live visitors | `stats.liveVisitors` (poll `GET /admin/analytics/live` every 15 s) |
| Fulfil orders chip | `stats.ordersToFulfill` → links to `/orders?orderStatus=Pending` |
| Sparklines / chart | `salesOverTime[] { date, revenue, orders, sessions }` (zero-filled per day, IST) |
| Stat cards | `stats.totalRevenue`, `stats.totalOrders`, `stats.totalProducts`, `stats.lowStockCount`, `stats.averageOrderValue` |
| Low-stock table | `lowStockAlerts[]` (`severity: critical/warning`) |
| Top products / recent orders | `topProducts[]`, `recentOrders[]` |

The response is permission-aware. Editors receive only catalog stats, so the UI renders whichever blocks are present.

**Sessions tracking.** The storefront sends `POST /api/v1/store/analytics/track { sessionId, path, referrer, device }` on each route change. `sessionId` is a random id kept in `sessionStorage`.

---

## 7. Data tables (shared `<DataTable>` component)

Every list endpoint follows the same contract, so build the table once and reuse it everywhere:

```
GET /admin/<resource>?page=1&limit=20&sort=-createdAt,name&q=rhodo&<filters>
→ { success, data: [...], pagination: { page, limit, total, totalPages, hasNextPage, hasPrevPage } }
```

- **URL is the state.** Keep `page`, `limit`, `sort`, `q` and filters in the URL search params, so views are shareable and the back button works. TanStack Query key: `['products', searchParams]`, with `placeholderData: keepPreviousData`.
- **Toolbar:** a search input (debounced 300 ms → `q`), filter pills (Shopify "Add filter"), and saved-view tabs (e.g. *All · Active · Draft · Low stock*).
- **Column header click** toggles `sort=field` → `sort=-field`. Only send the fields listed below; the backend ignores the rest.
- **Row selection** opens a bulk action bar (products: Activate / Deactivate / Feature / Delete → `PATCH /admin/products/bulk`).
- Show skeleton rows while loading, and an empty state with an illustration and the primary action.

| Resource | Filters | Sortable |
|---|---|---|
| Products | `collection`, `isActive`, `minPrice`, `maxPrice`, `stockStatus=in_stock\|low_stock\|out_of_stock`, `tag` | `name sku price stock createdAt updatedAt` |
| Orders | `orderStatus`, `paymentStatus`, `from`, `to`; `q` = `#1001` / email / SKU | `orderNumber totalAmount createdAt` |
| Customers | `segment=repeat\|vip\|new\|subscribers\|no_orders`, `acceptsMarketing`, `tag` | `name ordersCount totalSpent lastOrderAt createdAt` |
| Leads | `status`, `source`, `assignedTo=me` (the response also has a `pipeline` count per status) | `createdAt status name areaSqFt` |
| Discounts | `isActive`, `status=expired\|scheduled` | `code usedCount startsAt endsAt` |
| Content | `type=page\|blog_post`, `status` | `title publishedAt createdAt` |

**Leads view toggle.** Leads have two views: Table and Kanban (columns = `status`). Dragging a card calls `PATCH /admin/leads/:id { status }` with an optimistic update.

---

## 8. Modals, sheets & forms

| UI | Pattern | API flow |
|---|---|---|
| **Add product** | Full page `/products/new` (a large form, like Shopify). A *Quick add* `Dialog` is also available from the Collection page | 1) Images: drag-and-drop → `POST /admin/media` (multipart `files[]`, `folder=products`) → returns `[{url, publicId}]` → shown as sortable thumbnails with an alt-text field. 2) `POST /admin/products` with `images` from step 1. 3) On 422, map `error.details[].field` (e.g. `specifications.height.value`) to `setError()`. |
| Product form sections | Cards: *Title & description* (TipTap) · *Media* · *Pricing* (price, compare-at) · *Inventory* (SKU, stock, low-stock threshold) · *Specifications* (height+unit, leaf count, leaf material, trunk, flowers, pack size, toggles, custom key/values) · *FAQs* (repeater) · **Search engine listing** (meta title/description with character counters + live Google preview + "AI summary" preview from `seoPreview`) · Sidebar: *Status (Active/Draft)*, *Collection*, *Tags*, *Featured* | `GET /admin/products/:id` returns `seoPreview.google`, `seoPreview.aiSummary` and `seoPreview.jsonLd`. Show the JSON-LD in a collapsible "Structured data" panel. |
| Edit stock inline | `Popover` on the stock cell | `PATCH /admin/products/:id/inventory { mode:'adjust', quantity:+5 }` |
| Fulfil / ship order | `Dialog` with carrier, tracking number and URL | `PATCH /admin/orders/:id/status { orderStatus:'Shipped', tracking }`. On 409 `INVALID_TRANSITION`, show the `details.allowed` options. |
| Create collection | `Dialog` (name, description, cover image, SEO) | `POST /admin/collections` |
| Create discount | Full page (type radio cards, value, conditions, dates, applies-to picker) | `POST /admin/discounts` |
| Invite staff | `Dialog` (name, email, temp password, role select) | `POST /admin/users` (superadmin only) |
| Confirm destructive actions | `AlertDialog` that names the item | `DELETE …`. Surface 409 `COLLECTION_NOT_EMPTY` messages verbatim. |
| Media picker | `Dialog` with a grid from `GET /admin/media`, plus an upload tab | Reused by Products, Collections, Content, Settings (logo) |

**Error handling.** Every error has the shape `{ success:false, error:{ code, message, details? } }`.
- 422 → field errors.
- 409 → toast with `message`.
- 403 → "You don't have access".
- 429 → "Slow down" with the `Retry-After` value.
- 5xx → generic toast and a retry option.

---

## 9. Sales channels screens

**Agentic** (`/channels/agentic`)
- Status toggle: `PATCH /admin/channels/agentic { enabled }`.
- *Allow AI crawlers* toggle (GPTBot, PerplexityBot, ClaudeBot, Google-Extended…) → `{ allowAiCrawlers }`. This rewrites `robots.txt` live.
- Copy-able endpoints: product feed JSON, `llms.txt`, `robots.txt`.
- Readiness checklist, computed client-side from the product list:
  - products missing images
  - products missing `shortDescription`
  - products missing FAQs
  - meta descriptions over 160 characters

**Online Store** (`/channels/online-store`)
- Storefront URL, enabled toggle, sitemap link.
- *Preferences*: default meta title and description (`settings.seo`), social links, brand colours.

---

## 10. Theme (FYNE logo: green, light orange, white)

The values come from `GET /admin/navigation → store.brandColors`, which is editable in Settings → Brand. Define them as CSS variables so a change in Settings re-themes the admin instantly:

```css
:root {
  --brand-primary: #2E7D32;   /* green — primary buttons, active nav item, links */
  --brand-accent:  #F4A261;   /* light orange — badges, highlights, chart secondary series, focus rings */
  --brand-bg:      #FFFFFF;   /* white — page & card surfaces */
  --sidebar-bg:    #0F2E1A;   /* deep green sidebar (Shopify-style dark rail) */
  --sidebar-fg:    #E8F5E9;
  --muted:         #F6F8F6;   /* app background behind cards */
  --border:        #E3E8E4;
  --success: #2E7D32; --warning: #F4A261; --danger: #D64545;
}
```

The hex values above are starting points; match them to the exact logo values. Status badges:
- Paid / Delivered → green
- Pending → orange
- Failed / Cancelled → red
- Refunded → grey

---

## 11. Suggested frontend folder structure

```
admin/
├── src/
│   ├── app/            router.tsx, providers.tsx (QueryClient, Auth, Theme)
│   ├── lib/            api.ts (fetch + refresh), auth-store.ts, permissions.ts, format.ts (₹ en-IN)
│   ├── components/
│   │   ├── layout/     AppShell, Sidebar (renders /admin/navigation), Topbar, CommandSearch
│   │   ├── data-table/ DataTable, Toolbar, FilterPills, BulkBar, Pagination
│   │   ├── forms/      RichTextEditor, ImageUploader, MediaPicker, SeoPreview, SpecsFields
│   │   └── ui/         shadcn components
│   └── features/
│       ├── home/  orders/  products/  collections/  customers/  growth/  discounts/
│       ├── content/  markets/  analytics/  leads/  channels/  apps/  settings/  auth/
│       └── (each: api.ts hooks, list page, detail/edit page, dialogs)
```
