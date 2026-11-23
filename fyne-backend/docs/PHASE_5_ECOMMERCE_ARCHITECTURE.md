# Phase 5 — Future commerce architecture

This is a design outline only. Do not add these models or routes until Phase 5 is approved.

## Coupons and discounts

The backend already has a `Discount` model, admin CRUD, checkout validation, and order snapshots of the applied code and amount. Future work should extend that model rather than create a competing coupon collection.

- Add campaign metadata such as `campaignId`, `stackable`, `customerSegments`, `perCustomerLimit`, and an optional product/collection exclusion list.
- Keep eligibility evaluation in `services/discount.service.js`; return a normalized quote containing eligible line IDs, discount amount, and free-shipping result.
- Persist the discount snapshot on `Order` and atomically increment usage only when payment is secured (or the COD collection transition succeeds). Use a transaction or conditional update to enforce global and per-customer limits under concurrency.
- Proposed APIs: existing `POST /api/v1/store/discounts/validate` for previews; admin routes remain under `/api/v1/admin/discounts`; add a customer-facing promotion listing only if the merchandising team needs it.

## Product reviews and ratings

Add a `Review` collection with `product`, `customer`, `order`, `rating` (1–5), `title`, `body`, `status` (`pending`, `published`, `rejected`), moderation metadata, and timestamps. Enforce a unique `{ product, customer }` index initially, or `{ product, customer, order }` if multiple verified purchases may each be reviewed. Add indexes for `{ product, status, createdAt }` and `{ customer, createdAt }`.

- A review is verified only when the authenticated customer owns an order that contains the product and has `orderStatus: Delivered` and `paymentStatus: Paid`.
- Never accept customer or verification fields from the request body. Derive them from the access token and a server-side order lookup.
- Proposed APIs: `GET /api/v1/store/products/:slug/reviews` (published only), `POST /api/v1/store/products/:slug/reviews` (customer auth + verified-purchase guard), and admin list/update moderation routes under `/api/v1/admin/reviews`.
- Update product rating summaries with an aggregation or a carefully maintained count/sum; invalidate product detail cache when a review is published or removed.

## Advanced MongoDB text search

Keep the current `q` parameter on `GET /api/v1/store/products`; replace regex-based catalog matching with a search service when the catalog/search requirements are approved.

- For an initial MongoDB text-index implementation, index product `name`, `sku`, `tags`, and `shortDescription`; combine `$text` matches with existing active, collection, stock, and price filters. Project `textScore` and sort by score before merchandising tie-breakers.
- Keep exact SKU lookup as a high-priority path, and cap term length and result page size as the current validators do.
- If typo tolerance, synonyms, facets, or relevance tuning become requirements, use MongoDB Atlas Search with a versioned index definition rather than layering more regexes.
- Proposed architecture: `services/catalog-search.service.js` owns query construction and ranking; both storefront search and admin global search can call it while retaining their separate authorization and result shapes.
- Any index migration needs a deployment step and a rollback plan before switching traffic from the current query path.
