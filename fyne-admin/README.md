# FYNE SURFACES — Admin Panel (Next.js 14)

Shopify-style admin for the FYNE SURFACES / Premium Vertical Garden store. It is built on the `fyne-backend` Express API.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Axios · TanStack Query v5 · React Hook Form + Zod · Recharts · Zustand · lucide-react · sonner

## Run it

```bash
cp .env.example .env.local        # API_ORIGIN=http://localhost:5000
npm install
npm run dev                       # http://localhost:3000  (backend must be running on :5000)
```

Log in with the superadmin from the backend seed (`SEED_SUPERADMIN_EMAIL` / `SEED_SUPERADMIN_PASSWORD`).

Production: `npm run build && npm start`.

## How auth works

```
Browser ──/api/v1/*──► Next.js rewrite proxy ──► Express API (:5000)
```

- **One origin.** `next.config.mjs` proxies `/api/v1/*` to the API. This means:
  - there's no CORS to configure;
  - the HttpOnly refresh cookie (`path=/api/v1/auth`, `SameSite=Strict`) is set and sent on the admin's own origin.
- **Access token** lives in memory only, in a Zustand store (`src/lib/auth-store.ts`). It is never written to localStorage.
- **Page reload.** `AuthProvider` silently calls `POST /auth/refresh`. The browser sends the cookie automatically, and the session is restored.
- **Axios interceptor** (`src/lib/api.ts`):
  - On a 401 with `TOKEN_EXPIRED`, it calls `/auth/refresh` and retries the original request once.
  - The refresh is **single-flight**: if several requests fail at the same time, only one refresh call is made and the rest wait for it.
  - If the refresh fails, the session is cleared and the user goes to `/login?next=…&expired=1`.
- **Route protection** (`src/components/layout/AuthGuard.tsx` + `src/lib/access.ts`):
  - Not logged in → `/login?next=…`
  - Editor on `/dashboard/orders` → `/dashboard/products`
  - Admin on `/dashboard/users` → `/dashboard`
  - The guard runs client-side because neither token is visible to Next middleware, by design. The API enforces every permission independently.
- **Permissions** come from the API (`/auth/login`, `/auth/refresh`). Use `useAuth().can('products:delete')` or `<Can permission="…">` for UI gating.

## Structure

```
src/
├── app/
│   ├── login/page.tsx                 # centered login card
│   └── dashboard/
│       ├── layout.tsx                 # AuthGuard + DashboardLayout
│       ├── page.tsx                   # overview: stat cards, sales chart, status donut, recent orders
│       ├── products/page.tsx          # DataTable + Create/Edit modal
│       ├── collections/page.tsx       # CRUD with cover image
│       ├── orders/page.tsx            # DataTable + detail drawer
│       └── users/page.tsx             # superadmin-only staff management
├── components/
│   ├── layout/                        # Sidebar, Topbar, GlobalSearch (Ctrl K), Logo, AuthGuard
│   ├── data-table/DataTable.tsx       # pagination · sorting · search · column visibility
│   └── ui/                            # Button, Form (Input/Select/Field/Switch), Badge, Modal/Drawer, StatCard, ConfirmDialog…
├── features/
│   ├── products/                      # ProductFormModal (General · Specifications · SEO), Zod schema ↔ API mapping
│   ├── collections/                   # CollectionFormModal, useCollectionOptions
│   ├── orders/                        # OrderDrawer, OrderStatusSelect, status state machine
│   ├── media/ImageUploader.tsx        # Cloudinary upload (simulated if not configured)
│   └── dashboard/Charts.tsx           # Recharts: revenue + orders, status donut
├── lib/                               # api (axios), auth-store, access (RBAC), types, utils (₹ formatting), hooks
└── providers/                         # React Query, AuthProvider, Toaster
```

## Notes

- **Image uploads** go to `POST /admin/media` and then Cloudinary. If the API answers `503 UPLOADS_DISABLED`, the uploader *simulates* the upload with branded placeholder URLs, so the product flow still works end-to-end.
- **Order status updates** follow the backend state machine: `Pending → Shipped → Delivered`, or `→ Cancelled`.
  - By default only **superadmin** can update order status, because admins only have `orders:read`. Admins see a read-only badge instead of the dropdown.
  - To let admins update status, enable `P.ORDERS_UPDATE` for them in the backend's `permissions.js`.
- **Form validation** mirrors the backend rules. Server-side 422 errors are mapped back onto the right field, and the right tab gets an error dot.
- **Theme tokens** are in `tailwind.config.js`: `primary` #2E7D32 and `secondary` #F57C00, each with a 50–900 scale, plus `background` #F9FAFB and `surface` #FFFFFF.
- **Logo:** `src/components/layout/Logo.tsx` recreates the FYNE wordmark. To use the official file instead, drop it in `/public` and swap in an `<img>`.
