# E-Commerce API — Learning Guide

> Stack: Express 5 · TypeScript · Prisma 7 · PostgreSQL · Zod · ESM

This file is your roadmap. Each phase tells you **what** to build and **why**, but leaves the actual coding to you. Work through it top to bottom.

---

## Where You Are Now

You already have:
- Prisma schema with all models (User, Product, Category, Inventory, Cart, CartItem, Order, OrderItem, Payment, Review, Address)
- A seeded database
- A working `user` module (repository → service → controller → route)
- A bare `src/index.ts` with no middleware or routing wired up

---

## Phase 1 — Harden the Foundation

Before adding more modules, clean up what exists.

### 1.1 Wire up `src/index.ts`
Your entry point is almost empty. It needs:
- `express.json()` middleware
- `cors()` middleware (import from the `cors` package already installed)
- A `/api` prefix router that mounts all your module routes
- A global 404 handler for unknown routes
- A global error handler as the last middleware (4 args: `err, req, res, next`)

### 1.2 Complete the `user` module
The user module has controllers and a repository but is missing two files:

**`user.type.ts`** — define your TypeScript types/interfaces here:
- `CreateUserInput`
- `UpdateUserInput`
- `UserResponse` (what you return to the client — no `passwordHash`)

**`user.validation.ts`** — define Zod schemas:
- `createUserSchema` — name, email, password (plain text, not hash), phone
- `updateUserSchema` — all fields optional

**`user.controller.ts`** — currently passes raw body to the service. Add Zod validation before calling the service. Return a `400` with the Zod error if validation fails.

**`user.service.ts`** — `createUserService` receives a plain password but the DB stores a hash. Add password hashing here using Node's built-in `crypto.scrypt` or install `bcrypt`. Never store plain text passwords.

**`src/modules/user/index.ts`** — re-export the router so `src/index.ts` can import cleanly.

### 1.3 Consistent response shape
Pick a response envelope and stick to it everywhere:
```json
{ "data": {}, "message": "ok" }
{ "error": "something went wrong", "details": [] }
```
You can write a small helper `src/lib/response.ts` with `sendSuccess` and `sendError` functions.

---

## Phase 2 — Auth Module

This is the most important module. Everything else depends on it.

### 2.1 What to build
Inside `src/modules/auth/` create the standard files:
`auth.type.ts` · `auth.validation.ts` · `auth.service.ts` · `auth.controller.ts` · `auth.route.ts`

### 2.2 Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account, return JWT |
| POST | `/api/auth/login` | Verify credentials, return JWT |

### 2.3 Key concepts to implement
- **Password hashing** — hash on register, compare on login
- **JWT** — install `jsonwebtoken` + `@types/jsonwebtoken`. Sign a token with `{ userId, email }` payload. Store the secret in `.env` as `JWT_SECRET`.
- **Token expiry** — set a reasonable expiry (e.g. `7d`)

### 2.4 Auth middleware
Create `src/middleware/authenticate.ts`:
- Reads `Authorization: Bearer <token>` header
- Verifies the JWT
- Attaches `req.user = { userId, email }` to the request
- Returns `401` if missing or invalid

You'll need to extend Express's `Request` type. Create `src/types/express.d.ts` and augment the `Request` interface.

---

## Phase 3 — Product & Category Modules

### 3.1 Category (`src/modules/category/`)
Simple CRUD. Categories can have a `parentId` for subcategories.

| Method | Path | Auth required |
|--------|------|---------------|
| GET | `/api/categories` | No |
| GET | `/api/categories/:categoryId` | No |
| POST | `/api/categories` | Yes (admin — skip role check for now) |
| PUT | `/api/categories/:categoryId` | Yes |
| DELETE | `/api/categories/:categoryId` | Yes |

### 3.2 Product (`src/modules/product/`)
Products are linked to a category and have a separate `Inventory` record.

| Method | Path | Auth required |
|--------|------|---------------|
| GET | `/api/products` | No |
| GET | `/api/products/:productId` | No |
| POST | `/api/products` | Yes |
| PUT | `/api/products/:productId` | Yes |
| DELETE | `/api/products/:productId` | Yes |

Things to think about:
- When you `GET /api/products`, include the `Inventory` (stock) and `Category` in the response using Prisma's `include`
- When you create a product, also create its `Inventory` record in the same operation using Prisma's nested `create`
- Add query param filtering: `?categoryId=`, `?minPrice=`, `?maxPrice=`, `?search=` (name/description)
- Add pagination: `?page=1&limit=20` using Prisma's `skip` and `take`

---

## Phase 4 — Cart Module

The cart is per-user (one cart per user, already enforced by the `@unique` on `Cart.userId`).

| Method | Path | Auth required |
|--------|------|---------------|
| GET | `/api/cart` | Yes |
| POST | `/api/cart/items` | Yes |
| PUT | `/api/cart/items/:itemId` | Yes |
| DELETE | `/api/cart/items/:itemId` | Yes |
| DELETE | `/api/cart` | Yes (clear cart) |

Things to think about:
- `GET /api/cart` should return the cart with all items and their product details
- Adding an item: if the product is already in the cart, increment quantity instead of creating a duplicate
- Before adding to cart, check `Inventory.stockQuantity` — reject if out of stock
- The cart belongs to the authenticated user — always use `req.user.userId`, never trust a userId from the request body

---

## Phase 5 — Order Module

Orders are created from the cart contents.

| Method | Path | Auth required |
|--------|------|---------------|
| GET | `/api/orders` | Yes (own orders) |
| GET | `/api/orders/:orderId` | Yes (own order only) |
| POST | `/api/orders` | Yes |
| PATCH | `/api/orders/:orderId/status` | Yes |

Things to think about:
- `POST /api/orders` should:
  1. Read the user's cart
  2. Validate all items are still in stock
  3. Create the `Order` + `OrderItem` records
  4. Decrement `Inventory.stockQuantity` for each item
  5. Clear the cart
  6. All of this in a **Prisma transaction** (`prisma.$transaction`)
- `priceAtPurchase` on `OrderItem` must be snapshotted from the product at order time, not looked up later
- Users should only be able to see their own orders — always filter by `userId`

---

## Phase 6 — Review Module

| Method | Path | Auth required |
|--------|------|---------------|
| GET | `/api/products/:productId/reviews` | No |
| POST | `/api/products/:productId/reviews` | Yes |
| PUT | `/api/reviews/:reviewId` | Yes (own review) |
| DELETE | `/api/reviews/:reviewId` | Yes (own review) |

Things to think about:
- A user should only be able to review a product they actually ordered (optional challenge)
- Rating must be between 1 and 5 — enforce with Zod
- Users can only edit/delete their own reviews — check `review.userId === req.user.userId`

---

## Phase 7 — Address Module

| Method | Path | Auth required |
|--------|------|---------------|
| GET | `/api/addresses` | Yes |
| POST | `/api/addresses` | Yes |
| PUT | `/api/addresses/:addressId` | Yes |
| DELETE | `/api/addresses/:addressId` | Yes |
| PATCH | `/api/addresses/:addressId/default` | Yes |

Things to think about:
- When setting an address as default (`PATCH .../default`), first set all other addresses for that user to `isDefault: false`, then set the target to `true` — do this in a transaction
- Always scope queries to `req.user.userId`

---

## Phase 8 — Payment Module

Keep this simple — no real payment gateway, just record the payment.

| Method | Path | Auth required |
|--------|------|---------------|
| POST | `/api/orders/:orderId/payment` | Yes |
| GET | `/api/orders/:orderId/payment` | Yes |

Things to think about:
- Only allow payment on orders with status `pending`
- After a successful payment record, update the order status to `paid`
- Do both in a transaction

---

## Phase 9 — Production Hardening

Once all modules are working, go through this checklist:

### Error handling
- [ ] All async route handlers are wrapped — use a `asyncHandler` wrapper utility or Express 5's built-in async error propagation
- [ ] The global error handler catches Prisma errors (e.g. `P2002` unique constraint) and returns meaningful messages instead of 500s
- [ ] No raw error objects or stack traces leak to the client in production

### Security
- [ ] `helmet` installed and used — adds security headers
- [ ] Rate limiting on auth routes — install `express-rate-limit`
- [ ] Passwords never appear in any response
- [ ] JWT secret is long and stored only in `.env`

### Validation
- [ ] Every route that accepts a body has a Zod schema
- [ ] Route params (UUIDs) are validated — a bad UUID should return 400, not a Prisma crash

### Environment
- [ ] `.env` has `DATABASE_URL`, `JWT_SECRET`, `PORT`
- [ ] `.env` is in `.gitignore` (it already is)
- [ ] Add a `.env.example` with placeholder values for teammates

### Code quality
- [ ] No `any` types — replace with proper types or Prisma's generated types
- [ ] Consistent use of your response envelope helper everywhere
- [ ] No business logic in controllers — controllers only validate input and call services

---

## Module File Structure (follow this for every module)

```
src/modules/<name>/
  index.ts          ← re-exports the router
  <name>.type.ts    ← TypeScript interfaces
  <name>.validation.ts  ← Zod schemas
  <name>.repository.ts  ← Prisma queries only
  <name>.service.ts     ← business logic
  <name>.controller.ts  ← HTTP layer, calls service
  <name>.route.ts       ← Router, wires paths to controllers
```

---

## Suggested Build Order

1. Phase 1 — finish the foundation first, everything depends on it
2. Phase 2 — auth next, you need `req.user` before protecting any route
3. Phase 3 — products and categories (no auth dependency, good practice)
4. Phase 4 — cart (depends on auth + products)
5. Phase 5 — orders (depends on cart + inventory)
6. Phase 6 — reviews (depends on auth + products)
7. Phase 7 — addresses (depends on auth)
8. Phase 8 — payments (depends on orders)
9. Phase 9 — harden everything

---

Good luck. Take it one phase at a time.
