# FYNE SURFACES — Backend API & Admin Backend

Node.js + Express + MongoDB (Mongoose) backend for the **FYNE SURFACES / Premium Vertical Garden** artificial-plant store. It covers:

- a Shopify-style admin backend: Home, Orders, Products, Customers, Growth, Discounts, Content, Markets, Analytics, Leads, Sales channels (Agentic and Online Store), Apps and Settings
- a public storefront API
- gateway-agnostic payments
- SEO, AEO and GEO tooling

The admin UI spec is in **[docs/ADMIN_DASHBOARD_ARCHITECTURE.md](docs/ADMIN_DASHBOARD_ARCHITECTURE.md)**.

## Quick start

```bash
cp .env.example .env        # fill in MONGO_URI, JWT secrets, ImageKit, SEED_SUPERADMIN_*
npm install
npm run seed                # superadmin + 3 collections + 6 products + settings/market/apps
npm run dev                 # http://localhost:5000/health
```

Requires Node 18.18+ and MongoDB 6+. MongoDB Atlas is recommended because it runs as a replica set, which enables transactions later.

## Folder structure (MVC)

```
fyne-backend/
├── server.js                     # boot, DB connect, graceful shutdown
├── src/
│   ├── app.js                    # middleware pipeline & route mounting
│   ├── config/                   # env, db, ImageKit, permissions (RBAC), navigation (sidebar)
│   ├── models/                   # User, Collection, Product, Order, Customer, Discount, Content,
│   │                             # Market, Lead, Integration, Setting, Counter/Visit/Media
│   ├── middleware/               # auth (JWT), rbac, security (helmet/cors/sanitise), rateLimiters,
│   │                             # validate, upload (multer), error
│   ├── validators/               # express-validator chains per domain
│   ├── controllers/              # request handlers (thin) + CRUD factory
│   ├── services/                 # payment/PaymentService, order (inventory), discount, upload
│   ├── utils/                    # tokens, query (pagination/sort/search), slug, html, seo/{jsonLd,aeo,attributes}
│   ├── routes/                   # auth, admin, store, payment, index
│   └── seed/seed.js
└── docs/ADMIN_DASHBOARD_ARCHITECTURE.md
```

## Security

| Layer | Implementation |
|---|---|
| Access token | JWT HS256, 15 min, in JSON. Send as `Authorization: Bearer …`. Issuer, audience and type are checked. |
| Refresh token | JWT, 7 days, in an HttpOnly + Secure + SameSite=Strict cookie scoped to `/api/v1/auth`. Only a SHA-256 hash is stored. Rotated on every refresh; reuse of an old token revokes the session. |
| Session invalidation | The role is re-read from the DB on every request. Deactivating a user or changing a password takes effect immediately. |
| Passwords | bcrypt (12 rounds). Strong-password rule. Constant-time login, so the response doesn't reveal whether an email exists. |
| Headers / CORS | `helmet` with a strict CSP. CORS uses an origin whitelist with credentials. |
| Rate limiting | `express-rate-limit`. Login: 10 failed attempts per 15 min. Checkout, leads and discount checks: 30 per 15 min. Tracking: 120 per min. Global: 1500 per 15 min. |
| Injection | `express-mongo-sanitize` (NoSQL injection) and `xss-clean` on plain-text fields. Rich-text fields (`description`, `body`, `answer`) use an allow-list HTML sanitiser. |
| Mass assignment | Every controller whitelists fields with `pick()`. Prices are recomputed server-side at checkout. |
| Uploads | Images only, 8 MB, max 10 per request. Held in memory and uploaded to ImageKit. |

## RBAC

Permissions live in `src/config/permissions.js`, which is the only place to edit role rights.

- **superadmin:** everything, including creating, deleting and re-roling admins and editors.
- **admin:** products, collections, customers, discounts, content, leads, growth and analytics. Can **view** orders. Cannot manage staff. To let admins fulfil orders, uncomment `P.ORDERS_UPDATE` in `permissions.js`.
- **editor:** create and update products and collections, and upload media. No orders and no customer or user data.

## API reference (`/api/v1`)

### Auth
| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | `{email,password}` → `{accessToken,user,permissions}` and sets the refresh cookie |
| POST | `/auth/refresh` | Uses the cookie; rotates it; returns a new access token |
| POST | `/auth/logout` | Revokes the refresh token and clears the cookie |
| GET | `/auth/me` | Current user and permissions |
| PATCH | `/auth/password` | `{currentPassword,newPassword}` |

### Admin (Bearer token required; permission in brackets)
| Area | Endpoints |
|---|---|
| Shell | `GET /admin/navigation` (sidebar + badges) · `GET /admin/search?q=` (Ctrl K) |
| Home/Analytics | `GET /admin/analytics/dashboard?from&to` · `GET /admin/analytics/live` · `GET /admin/analytics/reports/sales-by-collection` |
| Staff `[users:manage]` | `GET/POST /admin/users` · `GET/DELETE /admin/users/:id` · `PATCH /admin/users/:id/role` · `PATCH /admin/users/:id/status` · `GET /admin/users/roles` |
| Products | `GET/POST /admin/products` · `GET/PATCH/DELETE /admin/products/:id` · `PATCH /admin/products/:id/inventory` · `PATCH /admin/products/bulk` |
| Collections | `GET/POST /admin/collections` · `GET/PATCH/DELETE /admin/collections/:id` |
| Orders | `GET /admin/orders` · `GET /admin/orders/:id` · `PATCH /admin/orders/:id/status` `[orders:update]` |
| Customers | `GET /admin/customers` · `GET /admin/customers/segments` · `GET/PATCH /admin/customers/:id` |
| Growth | `GET /admin/growth/overview` · `GET /admin/growth/abandoned-checkouts` |
| Discounts | `GET/POST /admin/discounts` · `GET/PATCH/DELETE /admin/discounts/:id` |
| Content | `GET/POST /admin/content?type=page\|blog_post` · `GET/PATCH/DELETE /admin/content/:id` |
| Files | `GET/POST /admin/media` (multipart `files[]`) · `PATCH/DELETE /admin/media/:id` |
| Markets | `GET/POST /admin/markets` · `GET/PATCH/DELETE /admin/markets/:id` |
| Leads | `GET /admin/leads` · `GET/PATCH/DELETE /admin/leads/:id` · `POST /admin/leads/:id/notes` |
| Sales channels | `GET /admin/channels` · `PATCH /admin/channels/:key` (`agentic`, `online-store`) |
| Apps | `GET/POST /admin/apps` · `GET/PATCH/DELETE /admin/apps/:id` |
| Settings | `GET/PATCH /admin/settings` |

Every list endpoint accepts `?page&limit(≤100)&sort=-field,field&q=` plus resource filters. It returns `{ success, data, pagination }`.

### Storefront (public)
| Method | Path |
|---|---|
| GET | `/store/settings` · `/store/collections` · `/store/collections/:slug` · `/store/products` · `/store/products/:slug` · `/store/content/:type(pages\|blog)` · `/store/content/:type/:slug` |
| POST | `/store/checkout` · `/store/discounts/validate` · `/store/leads` · `/store/analytics/track` |

### Payments
| Method | Path |
|---|---|
| POST | `/payments/webhook`: raw body, signature verified (see `services/payment/PaymentService.js`) |
| POST | `/payments/mock/simulate` `{orderId, outcome: success\|failure\|refund}`: development only |

### SEO / GEO
`GET /sitemap.xml` · `GET /robots.txt` · `GET /llms.txt` · `GET /api/v1/feeds/products.json`

These paths are also served under `/api/v1/seo/*`. Proxy them from the storefront domain.

## Checkout → payment flow

1. `POST /store/checkout` re-prices the cart from the DB, checks stock, applies the discount, computes GST and shipping, and upserts the customer. It creates an **Order with `paymentStatus: 'Pending'`** and returns a **mock payment intent** (amount in paise).
2. The gateway calls `POST /payments/webhook`. The signature is verified and the order is marked `Paid` idempotently. Stock is decremented with a guard and customer and discount stats are updated.
3. For COD and bank transfer, stock is reserved at checkout. COD is marked `Paid` when the order is set to `Delivered`.
4. Order status follows a state machine: `Pending → Shipped → Delivered` or `→ Cancelled`. Cancelling restocks the items.

To plug in **Razorpay or Stripe**, add a class that extends `PaymentGateway`, register it in `GATEWAYS`, and set `PAYMENT_PROVIDER`. The signature-verification recipe for both is in the comments.

## SEO, AEO & GEO

- **JSON-LD** (`utils/seo/jsonLd.js`): every product returns a `@graph` containing:
  - `Product`, with `Offer` (INR price, availability, GST flag), `Brand`, `height` as a `QuantitativeValue`, `material`, and `additionalProperty` for each spec
  - `BreadcrumbList`
  - `FAQPage`
  - `Organization`

  Collections return `CollectionPage` + `ItemList`. Pages and blog posts return `WebPage` or `BlogPosting`.
- **AEO payload** (`utils/seo/aeo.js`): each product includes:
  - a factual `summary` sentence that AI engines can quote
  - flat `facts`, labelled `attributes`, `faqs`, `breadcrumbs` and a canonical URL
  - `descriptionText` (plain text) alongside `descriptionHtml`
- **GEO:**
  - `llms.txt` gives a Markdown map of the catalog.
  - `/feeds/products.json` gives the full structured catalog.
  - `robots.txt` explicitly allows GPTBot, PerplexityBot, ClaudeBot and Google-Extended. This is switchable from Sales channels → Agentic.
- **Sitemap:** generated dynamically, with the Google image extension and `lastmod`.

## Deployment notes

- Set `NODE_ENV=production`, long random secrets, `CORS_ORIGINS` (storefront and admin) and `TRUST_PROXY`.
- Serve the API on the same site as the admin (e.g. `api.` and `admin.fynesurfaces.com`) so the `SameSite=Strict` refresh cookie is sent.
- For full atomicity of the checkout and inventory updates, use a replica set (Atlas) and wrap `order.service` calls in `session.withTransaction()`.
- `xss-clean` is no longer maintained. It is included because the spec requires it, and it works with Express 4 (pinned). Before moving to Express 5, replace it and `express-mongo-sanitize` with maintained equivalents.
