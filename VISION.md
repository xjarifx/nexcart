# E-Commerce API — The Plan

---

## Stack

- Runtime: Node.js + TypeScript (strict mode)
- Framework: Express 5
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT access token (15min) + refresh token (7 days, stored in DB)
- Validation: Zod — every input, no exceptions
- Docs: Swagger — annotated alongside routes, never after
- Config: dotenv — nothing hardcoded, ever

---

## Project Structure

```
src/
  index.ts
  lib/
    prisma.ts
    swagger.ts
    paginate.ts
    slug.ts
  middleware/
    authentication.middleware.ts
    globalErrorHandler.middleware.ts
  modules/
    auth/
    user/
    shop/
    category/
    product/
    cart/
    order/
    payment/
    review/
  types/
    express.d.ts
    errors.ts
prisma/
  schema.prisma
  seed.ts
```

Every module has exactly five files, no more, no less:

```
module.route.ts
module.controller.ts
module.service.ts
module.repository.ts
module.validation.ts
```

---

## Database Schema

### Enums

```
Role:          CUSTOMER | ADMIN
ShopStatus:    PENDING | ACTIVE | SUSPENDED
OrderStatus:   PENDING | CONFIRMED | SHIPPED | DELIVERED | CANCELLED
PaymentStatus: PENDING | COMPLETED | FAILED | REFUNDED
```

### User
```
id          uuid pk default uuid()
name        string
email       string unique
password    string  (bcrypt, 12 rounds)
phone       string
role        Role default CUSTOMER
createdAt   datetime
```

### RefreshToken
```
id        uuid pk
userId    uuid fk → User
token     string unique
expiresAt datetime
createdAt datetime
```

### Address
```
id            uuid pk
userId        uuid fk → User
addressLine1  string
addressLine2  string?
city          string
state         string
postalCode    string
country       string
isDefault     boolean default false
```

### Shop
```
id          uuid pk
ownerId     uuid unique fk → User
name        string
slug        string unique
description string
status      ShopStatus default PENDING
createdAt   datetime
```

One user, one shop. Shop starts PENDING, admin approves it to ACTIVE. Products from a PENDING or SUSPENDED shop never appear publicly.

### Category
```
id        uuid pk
name      string
slug      string unique
parentId  uuid? fk → Category (self-relation)
```

### Product
```
id          uuid pk
shopId      uuid fk → Shop
categoryId  uuid fk → Category
name        string
slug        string unique
description string
price       decimal(10,2)
brand       string
isActive    boolean default true
createdAt   datetime
```

Products belong to a shop. A seller manages products through their shop, not directly.

### Inventory
```
productId        uuid pk fk → Product
stockQuantity    int
reservedQuantity int default 0
```

Created automatically when a product is created. Never exists without a product.

### Cart
```
id        uuid pk
userId    uuid unique fk → User
createdAt datetime
updatedAt datetime
```

### CartItem
```
id        uuid pk
cartId    uuid fk → Cart
productId uuid fk → Product
quantity  int
unique: (cartId, productId)
```

### Order
```
id          uuid pk
userId      uuid fk → User
addressId   uuid fk → Address
status      OrderStatus default PENDING
totalAmount decimal(10,2)
createdAt   datetime
```

### OrderItem
```
id              uuid pk
orderId         uuid fk → Order
productId       uuid fk → Product
shopId          uuid fk → Shop
quantity        int
priceAtPurchase decimal(10,2)
```

`shopId` is snapshotted here. Even if a product is deleted later, the shop can always trace its sales.

### Payment
```
id            uuid pk
orderId       uuid unique fk → Order
paymentMethod string
status        PaymentStatus default PENDING
transactionId string unique
createdAt     datetime
```

### Review
```
id        uuid pk
userId    uuid fk → User
productId uuid fk → Product
rating    int  (1–5)
comment   string
createdAt datetime
unique: (userId, productId)
```

---

## Actors & Permissions

**CUSTOMER** — the default. Can browse, buy, review, manage their own profile and addresses, create a shop.

**SELLER** — not a role, not a flag. A user becomes a seller the moment they have an ACTIVE shop. Their shop record is the permission. No schema change needed to "become" a seller.

**ADMIN** — platform operator. Approves and suspends shops, manages categories, views all orders.

---

## Auth Strategy

Access token: JWT, 15 minutes, signed with `ACCESS_TOKEN_SECRET`. Stateless.
Refresh token: random string, 7 days, stored in `RefreshToken` table, signed with `REFRESH_TOKEN_SECRET`.

1. Login → return both tokens
2. Access token expires → `POST /api/auth/refresh` with refresh token → new access token
3. Logout → delete refresh token row from DB

---

## Middleware

**authenticate.ts**
1. Read `Authorization: Bearer <token>`
2. `jwt.verify` with `ACCESS_TOKEN_SECRET`
3. Fetch user from DB — confirm they still exist
4. Attach to `req.user`
5. Any failure → 401, no details

**authorize.ts**
```ts
const authorize = (...roles: Role[]) => // checks req.user.role
```
Usage: `authorize('ADMIN')`

**errorHandler.ts**
Global handler. `AppError` → return its status + message. Anything else → 500 generic. Stack trace logged in development only.

---

## Error Handling

```ts
class AppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message)
  }
}
```

Services throw `AppError`. Controllers have zero try/catch. Everything bubbles to the global handler.

---

## Response Shape

Three shapes. Never a fourth.

```json
{ "data": {} }
```
```json
{ "data": [], "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 0 } }
```
```json
{ "error": "message" }
```

Status codes speak for themselves. No narration.

---

## Pagination

Every list endpoint accepts `?page` (default 1) and `?limit` (default 20, max 100).
`paginate.ts` returns `{ skip, take }` for Prisma and the `meta` object. One helper, used everywhere.

---

## Slugs

`slug.ts` generates a URL-safe slug from a name on create. Slugs are unique and immutable after creation. Products, shops, and categories are publicly accessed by slug, never by ID.

---

## Soft Deletes

Products are never hard deleted. `isActive: false` removes them from all public endpoints. Order history stays intact forever.

---

## API Endpoints

### Auth
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout          authenticate
```

### User
```
GET    /api/users/me             authenticate
PUT    /api/users/me             authenticate
DELETE /api/users/me             authenticate

PUT    /api/users/me/password    authenticate

GET    /api/users/me/addresses          authenticate
POST   /api/users/me/addresses          authenticate
PUT    /api/users/me/addresses/:id      authenticate
DELETE /api/users/me/addresses/:id      authenticate
```

### Shop
```
POST   /api/shops                       authenticate         (create, status → PENDING)
GET    /api/shops/mine                  authenticate         (own shop)
PUT    /api/shops/mine                  authenticate         (update own shop)

GET    /api/shops/:slug                 public               (shop profile)

GET    /api/admin/shops                 authorize(ADMIN)     (?status filter)
PUT    /api/admin/shops/:id/approve     authorize(ADMIN)
PUT    /api/admin/shops/:id/suspend     authorize(ADMIN)
```

Note: `mine` is a fixed keyword, not a param. It will never conflict with `:slug`.

### Category
```
GET    /api/categories           public
GET    /api/categories/:slug     public
POST   /api/categories           authorize(ADMIN)
PUT    /api/categories/:id       authorize(ADMIN)
DELETE /api/categories/:id       authorize(ADMIN)
```

### Product — Seller (manage own shop's listings)
```
GET    /api/shops/mine/products              authenticate     (includes inactive)
POST   /api/shops/mine/products              authenticate
PUT    /api/shops/mine/products/:id          authenticate
DELETE /api/shops/mine/products/:id          authenticate     (soft delete)

GET    /api/shops/mine/products/:id/inventory    authenticate
PUT    /api/shops/mine/products/:id/inventory    authenticate
```

### Product — Public catalog
```
GET    /api/products             public    (?search, ?category, ?brand, ?shop, ?minPrice, ?maxPrice, ?page, ?limit)
GET    /api/products/:slug       public
```

Only products where `isActive: true` AND shop `status: ACTIVE` appear here.

### Cart
```
GET    /api/cart                 authenticate
POST   /api/cart/items           authenticate
PUT    /api/cart/items/:id       authenticate
DELETE /api/cart/items/:id       authenticate
DELETE /api/cart                 authenticate
```

Cart is created lazily on first item add.

### Order — Buyer
```
POST   /api/orders               authenticate    (checkout)
GET    /api/orders               authenticate    (own history)
GET    /api/orders/:id           authenticate    (own order detail)
```

### Order — Seller
```
GET    /api/shops/mine/orders            authenticate    (orders containing own products)
PUT    /api/shops/mine/orders/:id        authenticate    (CONFIRMED → SHIPPED only)
```

A seller sees orders that contain at least one of their products. They can only advance status forward, never backward.

### Order — Admin
```
GET    /api/admin/orders         authorize(ADMIN)
PUT    /api/admin/orders/:id     authorize(ADMIN)
```

### Payment
```
POST   /api/payments             authenticate
GET    /api/payments/:orderId    authenticate
```

### Review
```
GET    /api/products/:id/reviews     public
POST   /api/products/:id/reviews     authenticate
DELETE /api/reviews/:id              authenticate    (own review only)
```

---

## Checkout Transaction

Single Prisma `$transaction`. All or nothing.

1. Fetch cart with items, products, shops, and inventory
2. Fail 400 — cart is empty
3. Fail 400 — any product's shop is not ACTIVE
4. Fail 400 — any product has `isActive: false`
5. Fail 400 — `addressId` does not belong to the requesting user
6. Fail 409 — any item: `stockQuantity - reservedQuantity < quantity`
7. Calculate `totalAmount` server-side
8. Create `Order`
9. Create `OrderItem` records — snapshot `priceAtPurchase` and `shopId`
10. Decrement `stockQuantity` per inventory record
11. Delete all `CartItem` records
12. Return full order with items

---

## Order Status Rules

```
PENDING → CONFIRMED    (seller)
CONFIRMED → SHIPPED    (seller)
SHIPPED → DELIVERED    (buyer or auto)
any → CANCELLED        (buyer before SHIPPED, admin anytime)
```

Status only moves forward. No skipping steps. No going back except CANCELLED.

---

## Build Steps

Follow this exactly. Each step depends on the previous.

**Step 1 — Project foundation**
TypeScript, Express, Prisma, dotenv, folder structure. Nothing runs yet except a health check route.

**Step 2 — Schema**
Write the complete Prisma schema. Run migration. Write seed with realistic data covering all models.

**Step 3 — Shared utilities**
`AppError` class, global `errorHandler` middleware, `paginate` helper, `slug` helper.

**Step 4 — Auth module**
Register, login, refresh, logout. JWT + refresh token flow. No protected routes yet.

**Step 5 — authenticate middleware**
JWT verification, user fetch, `req.user` attachment. Test it manually before moving on.

**Step 6 — authorize middleware**
Role check factory. One function, used on all admin routes going forward.

**Step 7 — User module**
Profile read/update, password change, address CRUD. First use of `authenticate`.

**Step 8 — Category module**
Public reads, admin CRUD. First use of `authorize`.

**Step 9 — Shop module**
Create shop, read own shop, update own shop, public shop profile. Admin approve/suspend. Seller identity is established here.

**Step 10 — Product module**
Seller creates/updates/deletes products via `/shops/mine/products`. Inventory record created automatically on product creation. Public catalog endpoint with filters.

**Step 11 — Cart module**
Add, update, remove items. Lazy cart creation. Validate product is active and shop is active on add.

**Step 12 — Order module**
Checkout transaction. Buyer order history. Seller order view and status update. Admin order view.

**Step 13 — Payment module**
Record payment against an order. Read payment by order.

**Step 14 — Review module**
List reviews publicly. Authenticated create and delete.

**Step 15 — Swagger**
Every route annotated. Run through all endpoints in the UI and confirm responses match the documented shapes.
