# What's Blocking Production

> Last updated: March 27, 2026

---

### 1. Checkout race condition — stock can be oversold
**Severity: Critical bug**

The stock check and the inventory decrement are two separate steps. Under concurrent load, two users can both pass the `available >= quantity` check before either one decrements, resulting in more units sold than exist. The Prisma transaction wraps the writes but not the read, so the read is unprotected. Fix: replace the pre-flight check with an atomic conditional update inside the transaction and verify the affected row count.

---

### 2. Inventory never restored on order cancellation
**Severity: Critical bug**

When an order is cancelled, `stockQuantity` is never incremented back. Every cancellation permanently removes stock from the system. The cancellation logic needs to run an inventory restoration loop inside a transaction — the same items and quantities decremented at checkout must be added back.

---

### 3. No customer-facing order cancellation
**Severity: High — missing feature**

Only admins can cancel orders. A customer who placed a `PENDING` order has no way to cancel it themselves. This is a standard e-commerce expectation. Needs a new endpoint that allows the order owner to cancel while status is still `PENDING`, and must restore inventory (blocked by item 2).

---

### 4. No real payment gateway
**Severity: High — missing feature**

Every payment is recorded as `COMPLETED` immediately with no actual money movement. The `transactionId` is accepted from the client with zero verification — anyone can submit a fake ID. A real integration (Stripe) requires a server-side payment intent, a webhook to receive async confirmation, and status updated only after the webhook fires. `PaymentStatus.PENDING` and `PaymentStatus.FAILED` exist in the schema but are never used.

---

### 5. No password reset flow
**Severity: High — missing feature**

There is no forgot-password or reset-password endpoint. A user who forgets their password is permanently locked out with no recovery path. Needs a time-limited signed token, an email with a reset link, and a reset endpoint that verifies the token and updates the password.

---

### 6. No email notifications
**Severity: High — missing feature**

No email service is wired up anywhere. Users get no registration confirmation, no order confirmation after checkout, no shipping updates, and no password reset email. The reset flow (item 5) is fully blocked until this exists. Recommended: Resend or Nodemailer.

---

### 7. Seed script stores plaintext passwords
**Severity: High bug**

`prisma/seed.ts` stores `faker.internet.password()` directly without hashing. Seeded users cannot log in, and running the seed against a real database puts plaintext passwords in Postgres. Every user insert needs `await bcrypt.hash(password, 12)` before the value is stored.

---

### 8. No pagination on most list endpoints
**Severity: Medium — will become critical under load**

`paginate()` and `buildMeta()` exist and work but are only used on `GET /api/products`. Every other list endpoint returns the full table with no limit. These will become slow and memory-heavy as data grows:

- `GET /api/categories`
- `GET /api/products/:productId/reviews`
- `GET /api/users/me/addresses`
- `GET /api/shops/mine/orders`
- `GET /api/admin/orders`
- `GET /api/admin/shops`

---

### 9. No request body size limit
**Severity: Medium — security**

`express.json()` has no `limit` option. A client can send a multi-megabyte JSON body and tie up the event loop while it parses. One line fix: `express.json({ limit: "10kb" })`.

---

### 10. Category slug not checked for uniqueness on update
**Severity: Medium bug**

`shop.service.ts` and `product.service.ts` both check for slug conflicts before updating. `category.service.ts` does not. Renaming a category to a name that collides with an existing slug throws a raw Prisma unique constraint error instead of a clean 409. Needs a `findCategoryBySlug(newSlug)` check before the update, matching the pattern already used in the other two services.

---

### 11. No average rating on products
**Severity: Medium — performance and UX**

There is no `averageRating` field on `Product`. Any star rating display requires either fetching all reviews and computing client-side, or aggregating on every product query. Neither scales. Needs `averageRating` and `reviewCount` columns maintained atomically on review create and delete.

---

### 12. No DB indexes for search and filter fields
**Severity: Medium — performance**

Product search uses a case-insensitive `LIKE` scan on `name` with no index — a full table scan on every search request. Needs a `pg_trgm` GIN index on `Product.name`. Also worth indexing `Product.brand`, `Product.price`, and `Order.createdAt` which are used in filters and sorts.

---

### 13. `reservedQuantity` is dead code
**Severity: Medium — misleading**

`Inventory.reservedQuantity` is read during stock checks but never written to — it is always 0. This creates a false impression that reservation is implemented. Either implement proper reservation (increment on add-to-cart, decrement on checkout or cart expiry) or remove the field and simplify the stock check to `stockQuantity >= quantity`.

---

### 14. No Redis — no caching, no token blacklist
**Severity: Medium — performance and security**

Two problems Redis solves: hot reads (product catalog, categories) hit Postgres on every request with no cache layer; and after logout the access token (15 min TTL) stays valid with no way to revoke it immediately. Redis with short TTLs handles the cache, and a token JTI blacklist handles immediate revocation.

---

### 15. No email verification on registration
**Severity: Low — trust and data quality**

Users can register with any email they don't own. The email field cannot be trusted for notifications or recovery. Unverified accounts should be restricted from checkout until the email is confirmed. Blocked by item 6 (email service).

---

### 16. No CI pipeline
**Severity: Low — developer safety**

No automated check runs on push or pull request. A broken commit can reach `main` undetected. A minimal GitHub Actions workflow running `tsc --noEmit` and `npm test` on every push is a one-file addition.

---

### 17. Test coverage is happy-path only (~40–50%)
**Severity: Low — quality**

All 9 modules have tests but only for the success path. Untested scenarios that have caused real bugs in similar projects:

- Concurrent checkout (two users buying the last item simultaneously)
- Invalid UUID path params (should return 400, not a Prisma crash)
- Slug collision on category update
- Admin cancelling a delivered order (should be blocked)
- Payment submitted twice for the same order (should be 409)
- Checkout using another user's `addressId` (should be 404)
- Token refresh after logout (should be 401)
