# Production Readiness Audit

> Last updated: March 26, 2026
> Overall score: **6.1 / 10** — solid MVP foundation, not yet production-hardened.

---

## What's Actually Done Well

- Clean modular structure: every module follows route → controller → service → repository → validation
- JWT auth with refresh token rotation (opaque token, stored in DB, expiry checked)
- Zod validation on every input
- Global error handler with consistent response shape
- Checkout runs inside a Prisma transaction (atomic)
- Order status transitions are enforced (sellers can only PENDING→CONFIRMED→SHIPPED, admin controls the rest)
- Slug uniqueness checked before create/update on shop and product
- One-review-per-user constraint enforced at both DB and service level
- Pagination utility exists and is used on the product catalog
- Seed script covers all models with realistic fake data
- Swagger UI wired up
- Tests exist for all 9 modules

---

## Critical Bugs

**1. Real credentials committed to `.env`**
Your `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `IMAGEKIT_PRIVATE_KEY` are all in `.env` which is tracked by git. Rotate all of these immediately. Add `.env` to `.gitignore` and use `.env.example` with placeholder values instead.

**2. Race condition in checkout (stock oversell)**
The stock check and the inventory decrement are two separate steps. Under concurrent load, two users can both pass the stock check and both complete checkout, selling more than available. Fix: use a Postgres `SELECT ... FOR UPDATE` or a single `UPDATE inventory SET stockQuantity = stockQuantity - $qty WHERE productId = $id AND stockQuantity - reservedQuantity >= $qty` inside the transaction, and check the affected row count.

**3. `reservedQuantity` is dead code**
The field exists in the schema and is read during stock checks, but it is never written to. Either implement proper reservation (reserve on add-to-cart, release on checkout/expiry) or remove the field and simplify the stock check to just `stockQuantity`.

**4. Inventory not restored on order cancellation**
When an admin cancels an order, `stockQuantity` is never incremented back. The stock is permanently lost.

**5. Seed script stores plaintext passwords**
`prisma/seed.ts` uses `faker.internet.password()` directly — no bcrypt hashing. Seeded users cannot log in, and if the seed ever runs against a real DB it's a security hole.

**6. `REFRESH_TOKEN_SECRET` env var is loaded but never used**
Refresh tokens are opaque random bytes, not JWTs, so the secret is pointless. Either use it (sign the refresh token as a JWT) or remove it from `.env` to avoid confusion.

**7. No token blacklist on logout**
After logout the refresh token is deleted, but the access token (15 min TTL) is still valid. Anyone who intercepts it can keep using the API until it expires. Short TTL helps, but a Redis-backed blacklist or token version counter is the proper fix.

---

## Security Issues

**Critical**
- `.env` with real secrets in git (see above)
- No rate limiting on any endpoint — auth routes are wide open to brute force
- No `helmet` — missing `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy` headers
- No request body size limit — `express.json()` with no `limit` option, DoS via huge payloads

**High**
- No account lockout after failed login attempts
- Password minimum is only 8 characters with no complexity requirement
- `CORS` origin is `process.env.FRONTEND_URL` — if that env var is missing, `cors()` defaults to `*` (all origins)
- No HTTPS enforcement at the app level

**Medium**
- Error message `"Email already in use"` leaks user existence — use a generic message like `"Invalid credentials"` for login failures (already done) but registration should also be reconsidered
- No request ID / correlation ID — impossible to trace a request through logs
- No input sanitization for XSS (Zod validates shape but doesn't strip HTML/script tags from string fields)

---

## Missing Features (Functionality Gaps)

**Payments**
- Payment is always created as `COMPLETED` immediately — there is no real payment gateway integration (Stripe, PayPal, etc.)
- No webhook handler to receive async payment confirmation
- No refund flow — `PaymentStatus.REFUNDED` exists in the schema but nothing sets it
- ImageKit credentials are in `.env` but there is zero upload code anywhere

**Orders**
- No customer-facing order cancellation endpoint (only admin can cancel)
- No inventory restoration when an order is cancelled

**Users / Auth**
- No email verification on registration
- No password reset / forgot-password flow
- No 2FA
- No soft-delete for users — hard-deleting a user breaks order history (foreign key cascade or set-null needed)

**Search & Discovery**
- No full-text search (Postgres `tsvector` / `pg_trgm` or Elasticsearch)
- No product sorting (by price, rating, newest)
- No product filtering by rating
- No featured/promoted products

**Reviews**
- No check that the reviewer actually purchased the product before leaving a review
- No average rating computed/stored on the product (must be calculated on every request)

**Notifications**
- No email notifications (order confirmation, shipping update, password reset)
- No push/webhook notifications

---

## Pagination Gaps

`paginate()` utility exists but is only used on `GET /api/products`. Every other list endpoint returns all records:

- `GET /api/shops/mine/orders`
- `GET /api/admin/orders`
- `GET /api/admin/shops`
- `GET /api/users/me/addresses`
- `GET /api/products/:productId/reviews`
- `GET /api/categories`

These will become slow and memory-heavy as data grows.

---

## Performance & Scalability

- No database indexes beyond the auto-generated ones on `@unique` fields. The product search does a case-insensitive `LIKE` scan on `name` — add a `gin` index with `pg_trgm` for this.
- No caching layer (Redis) — every request hits the DB, including repeated reads of the same product/category
- No connection pooling config — `pg` pool defaults are used, which may be too low under load
- No background job queue — things like sending emails, updating search indexes, or processing payments should be async
- No CDN or image optimization pipeline despite ImageKit being configured

---

## Code Quality Issues

**Slug uniqueness on update is inconsistent**
- `shop.service.ts` correctly checks for slug conflicts before updating ✅
- `category.service.ts` does NOT check for slug conflicts before updating ❌
- `product.service.ts` — needs verification

**No constants file**
Magic strings like `"ACTIVE"`, `"PENDING"`, `"card"` are scattered across the codebase. The enums exist in generated Prisma code but aren't always used consistently.

**No logger**
`console.error` in the error handler is the only logging. In production you need structured logging (e.g., `pino` or `winston`) with log levels, request IDs, and log shipping.

**No config module**
Environment variables are read directly with `process.env.X` everywhere. A single `src/config.ts` that validates all required env vars at startup (using Zod) would catch misconfigurations before the server accepts traffic.

**`src/generated/prisma/` should not be in `src/`**
Generated files should live outside the source tree (e.g., `prisma/generated/`) or be excluded from linting/formatting. Having them in `src/` pollutes the module tree.

**`src/lib/prisma.d.ts` + `prisma.js`**
There's a `.js` file and a `.d.ts` file for the Prisma client in `src/lib/`. This is a workaround that suggests the Prisma client setup is non-standard. It should be a proper `.ts` file.

---

## Test Coverage Gaps

Current coverage is roughly 40–50% (happy paths only).

Missing:
- Concurrent checkout test (two users buying the last item simultaneously)
- Invalid UUID inputs (should return 400, not 500)
- Slug collision on category/product update
- Pagination boundary cases (page 0, limit 0, limit > 100)
- Filter combinations on product search
- Seller trying to update an order that belongs to a different shop
- Admin cancelling a delivered order (should be blocked)
- Payment recorded twice for the same order (should be 409)
- Review left without purchasing the product
- Address ownership — using another user's addressId at checkout
- Token expiry and refresh flow
- Logout then use old access token

---

## What to Do Next (Priority Order)

1. **Rotate all secrets, add `.env` to `.gitignore`** — do this before anything else
2. **Add `helmet` and a body size limit** — two lines of code, big security win
3. **Add rate limiting** (`express-rate-limit`) on auth routes at minimum
4. **Fix inventory restoration on order cancellation**
5. **Fix the checkout race condition** with a `SELECT FOR UPDATE` or atomic update
6. **Add a startup env validator** (`src/config.ts` with Zod)
7. **Add pagination to all remaining list endpoints**
8. **Add `pino` logger** and replace `console.error`
9. **Add category slug uniqueness check on update**
10. **Add a real payment gateway** (Stripe is the standard choice)
11. **Add email service** (Resend or Nodemailer) for registration and order events
12. **Add customer order cancellation endpoint** with inventory restoration
13. **Add average rating to product** (either computed column or updated on review create/delete)
14. **Add DB indexes** for product name search and common filter fields
15. **Add Redis** for caching hot reads (product catalog, categories) and access token blacklist
16. **Fix seed script** to hash passwords with bcrypt
17. **Expand test coverage** to edge cases and concurrent scenarios
18. **Add a CI pipeline** (GitHub Actions) that runs tests and type-check on every push
