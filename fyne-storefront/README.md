# FYNE SURFACES — Storefront (Next.js 14)

Customer-facing store for FYNE SURFACES / Premium Vertical Garden. It runs on the `fyne-backend` API.

**Stack:** Next.js 14 App Router · TypeScript · Tailwind CSS · Zustand (cart) · Framer Motion · Axios · React Hook Form + Zod · native Metadata API

## Run it

The backend must be running on `:5000`.

```bash
cp .env.example .env.local
npm install
npm run dev            # http://localhost:3001   (the admin panel uses :3000)
```

**One backend setting:** add the storefront to `CORS_ORIGINS` in `fyne-backend/.env`, then restart the backend:

```
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Production:** `npm run build && npm start`. Build while the API is reachable, so product pages are pre-rendered with real data.

## Pages

| Route | Rendering | Notes |
|---|---|---|
| `/` | ISR (5 min) | Hero, brand promises, 3 featured collections, best sellers carousel, B2B quote band |
| `/collections` | ISR | All collections + every product |
| `/collections/[slug]` | SSR + data cache | Hero banner, top filter bar: **Height** (ft ↔ cm), **Price**, **Sort**. Filters live in the URL |
| `/products/[slug]` | **SSG + ISR** | Gallery, price, Add to Cart / Buy now, "At a glance" facts, specs accordion, description, FAQs, related products |
| `/search?q=` | SSR | Uses the backend search (`noindex`) |
| `/cart`, `/checkout` | Client | Zustand cart, checkout form, discount codes, mock payment, success screen (`noindex`) |
| `/pages/[slug]` | ISR | CMS pages from Admin → Content (About, Contact, Shipping Policy) |
| `/sitemap.xml`, `/robots.txt`, `/llms.txt` | Proxied | Generated dynamically by the backend |

## SEO, AEO & GEO

- **Server-rendered HTML.** Product and collection pages are rendered on the server, so crawlers and AI bots get the full HTML: H1, price, specs, FAQs and JSON-LD, with no JavaScript required.
- **JSON-LD on product pages.** The `@graph` from the API contains:
  - `Product` (sku, brand, height, material, additionalProperty)
  - `Offer` (INR price, availability, GST flag)
  - `BreadcrumbList`
  - `FAQPage`
  - `Organization`

  It's injected server-side and escaped against `</script>` injection.
- **JSON-LD elsewhere:**
  - collection pages emit `CollectionPage` + `ItemList`;
  - the layout emits `Organization` + `WebSite` with a SearchAction.
- **`generateMetadata()`** on products, collections and CMS pages sets:
  - title, description and canonical;
  - OpenGraph and Twitter tags, plus `product:price:*` meta.
- **Filtered collection URLs** are `noindex` and canonicalise to the clean collection URL, so filters don't create duplicate content.
- **AEO "At a glance" block** (`src/lib/product-content.ts`): short, factual sentences built only from typed spec data, e.g. *"Stands 5.5 ft (168 cm) tall. Includes 1,130 leaves. Built on a wooden trunk."* Nothing is invented: if a field isn't in the database, it isn't stated.
- **Specs accordion keeps all content in the DOM.** Collapsed sections are hidden with CSS, not removed, so crawlers still read every spec.
- **Semantic HTML:**
  - one `<h1>` per page, with `h2`/`h3` sections;
  - `<article>` product cards, `<dl>` specs, `<details>` FAQs;
  - a skip link, and descriptive alt text on every image.

## Cart

`src/store/cart.ts` uses Zustand with `persist` to localStorage.

- It is rehydrated before any component writes to it, so a reload never wipes the cart.
- The badge waits for a `hydrated` flag, so server and client render the same HTML.
- Prices in the cart are **display-only**: the backend re-prices every line from the database at checkout.

## Checkout & payment

`POST /api/v1/store/checkout` creates the order with `paymentStatus: Pending` and returns a mock payment intent.

- While `NEXT_PUBLIC_MOCK_PAYMENTS=true`, the storefront then calls the backend's dev-only `/payments/mock/simulate`. That fires a signed webhook, which marks the order **Paid**, as a real gateway would.
- When Razorpay or Stripe is integrated, set it to `false` and open the gateway's checkout using the returned intent.
- Cash on delivery is also supported.

## Images

- **Product and collection photos** come from Cloudinary, uploaded through the admin.
- **Missing photos:** until a product has a photo, a brand-coloured botanical illustration is shown instead of a broken image.
- **Hero image:** add a high-resolution lifestyle photo (≥ 2400 px wide) at `public/images/hero.jpg`. The homepage hero uses it automatically on the next build.

## Analytics

A cookie-free page-view beacon (`PageViewTracker`) posts to `/store/analytics/track`. This feeds Sessions, Conversion rate and Live visitors on the admin dashboard.
