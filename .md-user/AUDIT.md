# What's Blocking Production

> Last updated: March 28, 2026

---

## 🔴 Critical — Must fix before any production deployment

---

### 1. Checkout race condition — stock can be oversold (COMPLETED)

**Severity: Critical bug**

The stock check and the inventory decrement are two separate steps. Under concurrent load, two users can both pass the `available >= quantity` check before either one decrements, resulting in more units sold than exist. The Prisma transaction wraps the writes but not the read, so the read is unprotected. Fix: replace the pre-flight check with an atomic conditional update inside the transaction and verify the affected row count. Use `UPDATE inventory SET "stockQuantity" = "stockQuantity" - $qty WHERE "productId" = $id AND "stockQuantity" >= $qty` via `prisma.$executeRawUnsafe` and check `rowsAffected === 1`.

**Files:** `order.service.ts` (lines 43–49), `order.repository.ts` (lines 99–105)

---

### 2. Inventory never restored on order cancellation (COMPLETED)

**Severity: Critical bug**

When an order is cancelled via `adminUpdateOrderStatusService`, `stockQuantity` is never incremented back. Every cancellation permanently removes stock from the system. The cancellation logic needs to run an inventory restoration loop inside a transaction — the same items and quantities decremented at checkout must be added back. Currently, `updateOrderStatus` in `order.repository.ts` is a single `prisma.order.update` call with no inventory write.

**Files:** `order.service.ts` (lines 140–157), `order.repository.ts` (line 38–39)

---

### 3. `.env` file committed with production secrets

**Severity: Critical — security**

The `.env` file is present in the working directory with real Aiven database credentials, ImageKit private keys, and JWT secrets in plain text. Although `.env` is listed in `.gitignore`, the file currently exists in the repo. If it was ever committed to git history, those secrets are compromised and must be rotated immediately. Verify with `git log --all --full-history -- .env` and rotate all secrets if any commit is found. The `.env` also contains short, low-entropy JWT secrets (36 characters of predictable hex string) instead of the minimum 64 random bytes recommended.

**Files:** `.env`, `.gitignore`

---

### 4. No request body size limit (COMPLETED)

**Severity: Critical — security (denial of service)**

`express.json()` in `app.ts` has no `limit` option. A client can send a multi-megabyte JSON body and exhaust server memory during parsing. Combined with no file upload size limit anywhere, a single malicious request can crash the process. One-line fix: `express.json({ limit: "10kb" })`. Similarly `express.urlencoded({ extended: true })` needs `{ limit: "10kb" }`.

**Files:** `app.ts` (line 56–57)

---

### 5. No graceful shutdown (COMPLETED)

**Severity: Critical — ops**

`index.ts` calls `app.listen()` but never handles `SIGTERM` or `SIGINT`. When the process is killed (container restart, deploy, scale-down) in-flight requests are dropped mid-response, database connections leak, and the Prisma client is never disconnected. The Docker `CMD` runs the Node process directly, so there is no init system to handle signals. Need: signal handlers that stop accepting new connections, drain in-flight requests, call `prisma.$disconnect()`, and then `process.exit(0)`.

**Files:** `index.ts`, `Dockerfile` (line 42)

---

### 6. Prisma client singleton has no connection pooling config (COMPLETED)

**Severity: Critical — ops**

`lib/prisma.ts` creates a `PrismaClient` with no connection pool limits. Under load, Prisma will open connections until PostgreSQL hits `max_connections` and rejects further requests with "too many connections". The Aiven Postgres instance likely has a 20–100 connection limit. Need: `pool: { min: 2, max: 10 }` in the `PrismaPg` adapter options, matching the target Postgres `max_connections`.

**Files:** `lib/prisma.ts`

---

## 🟠 High — Production will be broken or unusable without these

---

### 7. No customer-facing order cancellation (COMPLETED)

**Severity: High — missing feature**

Only admins can cancel orders. A customer who placed a `PENDING` order has no way to cancel it themselves. This is a standard e-commerce expectation. Needs a new endpoint `DELETE /api/orders/:id` or `PUT /api/orders/:id/cancel` that allows the order owner to cancel while status is still `PENDING`, and must restore inventory (blocked by item 2).

**Files:** `order.route.ts`, `order.service.ts`, `order.controller.ts`

---

### 8. No real payment gateway

**Severity: High — missing feature**

Every payment is recorded as `COMPLETED` immediately with no actual money movement. The `transactionId` is accepted from the client with zero verification — anyone can submit a fake ID. A real integration (Stripe) requires a server-side payment intent, a webhook to receive async confirmation, and status updated only after the webhook fires. `PaymentStatus.PENDING` and `PaymentStatus.FAILED` exist in the schema but are never used.

**Files:** `payment.service.ts` (line 34), `payment.validation.ts`

---

### 9. No password reset flow

**Severity: High — missing feature**

There is no forgot-password or reset-password endpoint. A user who forgets their password is permanently locked out with no recovery path. Needs a time-limited signed token, an email with a reset link, and a reset endpoint that verifies the token and updates the password.

**Files:** `auth.route.ts`, `auth.service.ts`

---

### 10. No email notifications

**Severity: High — missing feature**

No email service is wired up anywhere. Users get no registration confirmation, no order confirmation after checkout, no shipping updates, and no password reset email. The reset flow (item 9) is fully blocked until this exists. Recommended: Resend or Nodemailer with a transactional template system.

**Files:** none exist — needs a new `lib/email.ts` or `lib/mailer.ts`

---

### 11. Seed script stores plaintext passwords (COMPLETED)

**Severity: High bug**

`prisma/seed.ts` stores `faker.internet.password()` directly without hashing. Seeded users cannot log in (bcrypt.compare will always fail against a plaintext password), and running the seed against a real database puts plaintext passwords in Postgres. Every user insert needs `await bcrypt.hash(password, 12)` before the value is stored.

**Files:** `prisma/seed.ts` (line 33)

---

### 12. CORS is hardcoded to a single origin (COMPLETED)

**Severity: High — deployment**

`app.ts` reads `process.env.FRONTEND_URL` as a single string for CORS origin. Production e-commerce platforms typically need multiple allowed origins (web, mobile-web, admin panel, staging). The value is not validated — if `FRONTEND_URL` is unset or empty, CORS silently allows no origins, which breaks all browser-based clients without any error message. Needs an array-based origin configuration with explicit validation at startup.

**Files:** `app.ts` (lines 46–51), `config.ts`

---

### 13. No input sanitization on UUID path parameters (COMPLETED)

**Severity: High — stability**

Every `:id` path parameter flows directly into Prisma `findUnique({ where: { id } })` with no UUID format validation. Sending a non-UUID string (e.g. `GET /api/orders/hello`) crashes Prisma with an unhandled `PrismaClientValidationError` that leaks internal schema details to the client. Every route accepting a UUID param needs a validation middleware that checks `z.string().uuid()` before the controller runs.

**Files:** all `*.controller.ts` files where `req.params.id` is used

---

### 14. No cascade delete rules in schema — orphan row risk

**Severity: High — data integrity**

The Prisma schema has no `onDelete` directives on any relation. The default is `Restrict`, meaning deleting a user fails if they have orders, reviews, addresses, etc. But `users.repository.ts` calls `prisma.user.delete()` with a comment saying "cascades to addresses, cart, orders, reviews via DB relations" — that cascade does not exist. Deleting a user with any related data throws a foreign key error. Either add `onDelete: Cascade` in the schema or implement soft-delete for users.

**Files:** `prisma/schema.prisma` (all `@relation` directives), `users.repository.ts` (line 21–22)

---

### 15. Category deletion has no child/product guard (COMPLETED)

**Severity: High — data integrity**

`deleteCategoryService` deletes a category without checking if it has children or products. If a category has children, the self-referencing `parentId` FK will throw a Prisma error. If it has products, those products become orphaned with a dangling `categoryId`. Needs: refuse deletion if `children.length > 0` or `products.length > 0`, or cascade appropriately.

**Files:** `category.service.ts` (lines 85–89), `category.repository.ts` (line 41–42)

---

### 16. Config doesn't validate ImageKit variables (COMPLETED)

**Severity: High — silent failure**

`config.ts` validates `DATABASE_URL`, `FRONTEND_URL`, and token secrets, but `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, and `IMAGEKIT_URL_ENDPOINT` from `.env.example` are not validated. If the app relies on ImageKit for image uploads (implied by the env vars), missing keys will cause silent runtime failures. Either add them to the Zod schema or remove them from `.env.example` if they're not used yet.

**Files:** `config.ts`, `.env.example`

---

## 🟡 Medium — Will cause pain in production under real traffic

---

### 17. No pagination on most list endpoints

**Severity: Medium — will become critical under load**

`paginate()` and `buildMeta()` exist and work but are only used on `GET /api/products`. Every other list endpoint returns the full table with no limit. These will become slow and memory-heavy as data grows:

- `GET /api/categories` — `findAllCategories()` returns all
- `GET /api/products/:productId/reviews` — `findReviewsByProductId` returns all
- `GET /api/users/me/addresses` — `findAddressesByUserId` returns all (low risk, but still unbounded)
- `GET /api/shops/mine/orders` — `findOrdersByShopId` returns all
- `GET /api/orders` — `findOrdersByUserId` returns all
- `GET /api/admin/orders` — `findAllOrders` returns all (highest risk — grows with platform)
- `GET /api/admin/shops` — `findAllShops` returns all
- `GET /api/shops/mine/products` — `findProductsByShopId` returns all

**Files:** every `*.repository.ts` using `findMany` without `take`/`skip`

---

### 18. Category slug not checked for uniqueness on update (COMPLETED)

**Severity: Medium bug**

`shop.service.ts` and `product.service.ts` both check for slug conflicts before updating. `category.service.ts` does not. Renaming a category to a name that collides with an existing slug throws a raw Prisma unique constraint error instead of a clean 409. Needs a `findCategoryBySlug(newSlug)` check before the update, matching the pattern already used in the other two services.

**Files:** `category.service.ts` (lines 63–83)

---

### 19. No average rating on products

**Severity: Medium — performance and UX**

There is no `averageRating` field on `Product`. Any star rating display requires either fetching all reviews and computing client-side, or aggregating on every product query. Neither scales. Needs `averageRating` and `reviewCount` columns maintained atomically on review create and delete.

**Files:** `prisma/schema.prisma` (Product model), `review.service.ts`

---

### 20. No DB indexes for search and filter fields

**Severity: Medium — performance**

Product search uses a case-insensitive `contains` (LIKE/ILIKE) scan on `name` with no index — a full table scan on every search request. Needs a `pg_trgm` GIN index on `Product.name`. Also worth indexing:

- `Product.brand` (used in product filters)
- `Product.price` (used in range filters)
- `Order.createdAt` (used in `orderBy`)
- `OrderItem.shopId` (used in seller order queries `where: { items: { some: { shopId } } }`)
- `Product.categoryId` (used in category filter joins)

**Files:** `prisma/schema.prisma`

---

### 21. `reservedQuantity` is dead code

**Severity: Medium — misleading**

`Inventory.reservedQuantity` is read during stock checks in `cart.service.ts` and `order.service.ts` but never written to — it is always 0 (or random from seed). This creates a false impression that reservation is implemented. The seed script even writes random `reservedQuantity` values (line 109), which would cause incorrect stock calculations. Either implement proper reservation (increment on add-to-cart, decrement on checkout or cart expiry) or remove the field and simplify the stock check to `stockQuantity >= quantity`.

**Files:** `prisma/schema.prisma` (Inventory model), `cart.service.ts` (lines 44–45), `order.service.ts` (line 47), `prisma/seed.ts` (line 109)

---

### 22. No Redis — no caching, no token blacklist

**Severity: Medium — performance and security**

Two problems Redis solves: hot reads (product catalog, categories) hit Postgres on every request with no cache layer; and after logout the access token (15 min TTL) stays valid with no way to revoke it immediately. Redis with short TTLs handles the cache, and a token JTI blacklist handles immediate revocation.

**Files:** `auth.service.ts`, `lib/prisma.ts`

---

### 23. Auth middleware hits the database on every request

**Severity: Medium — performance**

`auth.middleware.ts` calls `findUserById(decoded.id)` on every authenticated request. For an API handling hundreds of requests per second, this means hundreds of `SELECT * FROM "User"` queries per second just for auth. The user record rarely changes. Either cache the user in Redis for the access token's lifetime, or carry the necessary user data (id, role) in the JWT payload and only hit the DB when an operation actually needs fresh user data.

**Files:** `middleware/auth.middleware.ts` (line 40)

---

### 24. No rate limiting per-user — only per-IP (COMPLETED)

**Severity: Medium — security**

`express-rate-limit` is configured per IP only. Behind a reverse proxy (Nginx, Cloudflare, AWS ALB), all requests appear from the proxy's IP unless `trust proxy` is set. Even with correct IP forwarding, rate limiting per IP doesn't prevent a logged-in user from scripting abuse. Need: `app.set('trust proxy', 1)` for proxy environments, and consider adding per-user rate limiting on sensitive endpoints (checkout, review submission).

**Files:** `app.ts` (lines 62–77), `index.ts`

---

### 25. No review-purchase verification (COMPLETED)

**Severity: Medium — trust and data quality**

Anyone with an account can review any product without having purchased it. This allows review bombing and fake positive reviews. The `createReviewService` should check that the user has at least one `DELIVERED` order containing the product before allowing a review.

**Files:** `review.service.ts` (lines 32–46)

---

### 26. Swagger docs exposed in production (COMPLETED)

**Severity: Medium — security**

`/api-docs` is always mounted regardless of `NODE_ENV`. In production, this exposes the complete API schema, all endpoints, and parameter shapes to potential attackers for free reconnaissance. Swagger should be conditionally mounted only when `NODE_ENV !== "production"`.

**Files:** `app.ts` (line 110)

---

### 27. No request ID / correlation ID (COMPLETED)

**Severity: Medium — observability**

There is no request ID attached to logs. When debugging a production issue across pino-http log lines, there's no way to correlate all logs from a single request. `pino-http` supports a `genReqId` option, or use a `X-Request-Id` header middleware. This becomes essential once the API runs multiple replicas behind a load balancer.

**Files:** `app.ts` (line 24), `lib/logger.ts`

---

### 28. Seed script creates unrealistic data relationships

**Severity: Medium — developer experience**

The seed script has logical inconsistencies that make local testing unreliable:

- `reservedQuantity` is set to random values (line 109) despite never being updated anywhere in the app
- Categories use `undefined` for `parentId` (line 78) which Prisma treats differently from `null` — the `i < 2 ? null : undefined` expression is confusing and could produce unexpected hierarchies
- Every user gets a cart with random products, but the stock isn't verified against the cart quantities
- All orders get a payment record, but some orders are `PENDING` or `CANCELLED` — they shouldn't have payments

**Files:** `prisma/seed.ts`

---

### 29. No Prisma error handling for known constraint violations (COMPLETED)

**Severity: Medium — developer experience**

Prisma throws `PrismaClientKnownRequestError` with specific error codes (P2002 for unique violation, P2025 for record not found, P2003 for FK violation) but the error handler only catches `ZodError` and `AppError`. Any Prisma constraint error returns a raw 500 with `"Internal server error"` instead of a meaningful message. Need a Prisma error mapper in `errorHandler.middleware.ts` that converts P2002 → 409, P2025 → 404, P2003 → 400 with clean messages.

**Files:** `middleware/errorHandler.middleware.ts`

---

### 30. `deleteUserById` has no cleanup — cascading deletion will fail

**Severity: Medium — data integrity**

`users.service.ts` calls `deleteUserById` which does a hard `prisma.user.delete()`. But the schema has no cascade rules. If the user has any orders, reviews, addresses, cart items, or a shop, this throws a FK constraint error. The user can only be deleted if they have zero related data — which is never the case after any usage. Either implement soft-delete (`isActive: false`) or add cascade rules (and consider the downstream implications on orders, payments, etc.).

**Files:** `users.service.ts` (lines 38–42), `users.repository.ts` (line 21–22), `prisma/schema.prisma`

---

### 31. Order total calculated server-side but not verified

**Severity: Medium — financial accuracy**

`checkoutService` computes `totalAmount` by multiplying `item.product.price * item.quantity`. But `price` is a `Decimal(10,2)` in Postgres, which JavaScript `Number()` casts can lose precision on. For financial calculations, use a decimal library (like `decimal.js`) or keep values as strings until the final write. Additionally, there is no check for `price > 0` on the product — a product with `0` or even negative price would produce a `0` order total.

**Files:** `order.service.ts` (lines 51–54), `product.validation.ts` (line 14 — `z.number().positive()` does prevent 0, but the DB could have legacy data)

---

## 🔵 Low — Should fix before scaling, but won't block launch

---

### 32. No email verification on registration

**Severity: Low — trust and data quality**

Users can register with any email they don't own. The email field cannot be trusted for notifications or recovery. Unverified accounts should be restricted from checkout until the email is confirmed. Blocked by item 10 (email service).

**Files:** `auth.service.ts`

---

### 33. CI pipeline exists but has no type-checking step (COMPLETED)

**Severity: Low — developer safety**

The CI pipeline runs lint and tests but does not run `tsc --noEmit` as a separate step. A type error that doesn't cause a lint failure or isn't covered by tests will pass CI and reach `main`. Add a `typecheck` job that runs `npx tsc --noEmit` before or alongside the lint job.

**Files:** `.github/workflows/ci.yml`

---

### 34. Test coverage is happy-path only (~40–50%)

**Severity: Low — quality**

All 9 modules have tests but only for the success path. Untested scenarios that have caused real bugs in similar projects:

- Concurrent checkout (two users buying the last item simultaneously)
- Invalid UUID path params (should return 400, not a Prisma crash)
- Slug collision on category update
- Admin cancelling a delivered order (should be blocked)
- Payment submitted twice for the same order (should be 409)
- Checkout using another user's `addressId` (should be 404)
- Token refresh after logout (should be 401)
- Deleting a user who has orders (should handle gracefully)
- Creating a review for a product you haven't purchased
- Checkout when a product becomes inactive mid-cart

**Files:** `src/tests/*.test.ts`

---

### 35. No API versioning

**Severity: Low — maintainability**

All routes are mounted at `/api/`. Once clients are in production, any breaking change requires careful deprecation. Versioning with `/api/v1/` costs nothing upfront and saves major migration pain later. Change the prefix now before any client integrates.

**Files:** `app.ts` (lines 93–106)

---

### 36. No health check for database connectivity (COMPLETED)

**Severity: Low — ops**

The `/health` endpoint returns `200 OK` unconditionally, even when the database is down. A genuine health check should `SELECT 1` from postgres (or `prisma.$queryRaw\`SELECT 1\``) and include the result. Kubernetes/ECS liveness and readiness probes rely on this to avoid routing traffic to broken pods.

**Files:** `app.ts` (lines 85–87)

---

### 37. `package.json` has `name: "server"` with no description (COMPLETED)

**Severity: Low — professionalism**

The package name is `"server"` with an empty `"description"` and empty `"keywords"`, `"author"`. This is a leftover from project scaffolding. Should be `"nexcart-api"` with a proper description for npm registry hygiene and Docker image labels.

**Files:** `package.json` (lines 2–4)

---

### 38. Dockerfile runs migrations on every container start (COMPLETED)

**Severity: Low — ops risk**

`CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]` runs `migrate deploy` every time the container boots. In a multi-replica deployment, all replicas race to run migrations simultaneously, which can cause lock contention or duplicate migration attempts. Migrations should run as a separate one-off Job/Task, not as part of the server boot sequence.

**Files:** `Dockerfile` (line 42)

---

### 39. Swagger spec uses hardcoded `./src/modules/**/*.route.ts` glob (COMPLETED)

**Severity: Low — build compatibility**

The swagger-jsdoc `apis` glob `"./src/modules/**/*.route.ts"` works in development with `tsx` but will fail after `tsc` build because the compiled output is `.js` files in `dist/`. If API docs are ever served from the production build, routes won't be detected. Either use `"./src/modules/**/*.route.{ts,js}"` or generate the spec at build time.

**Files:** `lib/swagger.ts` (line 64)

---

### 40. No `updatedAt` on most models

**Severity: Low — auditing**

Only `Cart` has `@updatedAt`. `User`, `Order`, `Shop`, `Product`, `Address`, and `Payment` have no `updatedAt` column. This makes debugging production issues ("when did this order status change?") impossible without external logging. Add `updatedAt DateTime @updatedAt` to all mutable models.

**Files:** `prisma/schema.prisma`

---

### 41. No admin user management endpoints

**Severity: Low — missing feature**

There is no way for an admin to list users, search users, view a user's profile, or promote/demote users via the API. The only admin endpoints are for shops and orders. An admin panel needs at minimum: `GET /api/admin/users` (paginated), `GET /api/admin/users/:id`, `PUT /api/admin/users/:id/role`.

**Files:** needs new `admin/` module or extensions to `users.route.ts`

---

### 42. No product image support

**Severity: Low — missing feature**

The `Product` model has no image field(s). The `.env` contains ImageKit credentials, but there is no upload endpoint, no image URL field on `Product`, and no multi-image gallery support. An e-commerce product without images is unsellable. Needs: `images String[]` (or a separate `ProductImage` model) and an upload endpoint.

**Files:** `prisma/schema.prisma` (Product model), `.env` (ImageKit keys present but unused)

---

### 43. `pino-http` logger initialized before `logger` import (COMPLETED)

**Severity: Low — code quality**

In `app.ts`, `pinoHttp` is called on line 24 using `logger`, but `logger` is imported on line 38. This works only because of hoisting of `import` statements, but it makes the code confusing to read and fragile to refactoring. Move the `import logger` above the `pinoHttp` usage.

**Files:** `app.ts` (lines 24, 38)

---

### 44. No `PATCH` method — all mutations use `PUT`

**Severity: Low — API design**

All update endpoints use `PUT`, but the request bodies are partial (validated with `.partial()`). REST convention is `PUT` for full replacement and `PATCH` for partial update. Since the API only supports partial updates, using `PATCH` would be more semantically correct and better align with consumer expectations.

**Files:** all `*.route.ts` files using `router.put()` for partial updates

---

### 45. Expired refresh tokens are never cleaned up (COMPLETED)

**Severity: Low — database hygiene**

Expired `RefreshToken` records are only deleted when a user happens to call `/refresh` with that specific token. Tokens that expire without being used accumulate indefinitely. A user who logs in daily for a year leaves 365 expired token rows. Need a periodic cleanup job (cron) that deletes tokens where `expiresAt < NOW()`.

**Files:** `auth.service.ts`, schema `RefreshToken` model

---

### 46. No sort option on product listing (COMPLETED)

**Severity: Low — UX**

`GET /api/products` supports search, category, brand, shop, and price range filters, but has no `sort` parameter. Users cannot sort by price (low-to-high, high-to-low), newest, or popularity. This is a basic e-commerce catalog expectation. Add a `sort` query param with options like `price_asc`, `price_desc`, `newest`, `name_asc`.

**Files:** `product.validation.ts`, `product.service.ts`, `product.repository.ts`

---

### 47. Seller endpoints have no shop-status guard

**Severity: Low — business logic**

A seller whose shop is `PENDING` or `SUSPENDED` can still create products, update inventory, and view orders. Their products won't appear publicly, but they can accumulate data in a suspended shop. Seller write operations should check `shop.status === ACTIVE` before allowing mutations.

**Files:** `product.service.ts` (`getSellerShop` helper), `order.service.ts`

---
