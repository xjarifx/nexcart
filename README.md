# NexCart API

A multi-vendor e-commerce REST API built with Express, TypeScript, Prisma, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js (ESM)
- **Framework:** Express 5
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma 7 with `@prisma/adapter-pg`
- **Database:** PostgreSQL
- **Auth:** JWT (access token) + opaque refresh token
- **Validation:** Zod
- **Testing:** Vitest + Supertest
- **Docs:** Swagger UI at `/api-docs`

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your values
cp .env.example .env

# 3. Run migrations
npx prisma migrate deploy

# 4. (Optional) Seed the database with fake data
npm run seed

# 5. Start the dev server
npm run dev
```

The server starts on `http://localhost:3000` by default.

### Environment Variables

```env
DATABASE_URL=postgres://user:password@host:port/dbname
PORT=3000
FRONTEND_URL=http://localhost:7777

ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Build and run production server |
| `npm test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run seed` | Seed the database with fake data |

---

## API Overview

Base URL: `/api`  
Interactive docs: `GET /api-docs`  
Health check: `GET /health`

### Auth — `/api/auth`

| Method | Path | Description |
|---|---|---|
| POST | `/register` | Register a new customer account |
| POST | `/login` | Login, returns access + refresh tokens |
| POST | `/refresh` | Exchange refresh token for a new access token |
| POST | `/logout` | Invalidate refresh token |

### Users — `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | ✅ | Get own profile |
| PUT | `/me` | ✅ | Update name / phone |
| DELETE | `/me` | ✅ | Delete account |
| PUT | `/me/password` | ✅ | Change password |
| GET | `/me/addresses` | ✅ | List saved addresses |
| POST | `/me/addresses` | ✅ | Add a new address |
| PUT | `/me/addresses/:id` | ✅ | Update an address |
| DELETE | `/me/addresses/:id` | ✅ | Delete an address |

### Categories — `/api/categories`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List all categories |
| GET | `/:slug` | — | Get category by slug |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |

### Shops — `/api/shops`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List active shops |
| GET | `/:slug` | — | Get shop by slug |
| POST | `/` | ✅ | Create a shop (one per user) |
| GET | `/mine` | ✅ | Get own shop |
| PUT | `/mine` | ✅ | Update own shop |

### Admin Shops — `/api/admin/shops`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | List all shops (filter by status) |
| PUT | `/:id/approve` | Admin | Approve a pending shop |
| PUT | `/:id/suspend` | Admin | Suspend an active shop |

### Products — `/api/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List products (search, filter, paginate) |
| GET | `/:slug` | — | Get product by slug |

Query params for `GET /api/products`: `search`, `category`, `brand`, `shopSlug`, `minPrice`, `maxPrice`, `page`, `limit`

### Seller Products — `/api/shops/mine/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Seller | List own products |
| POST | `/` | Seller | Create a product |
| PUT | `/:id` | Seller | Update a product |
| DELETE | `/:id` | Seller | Delete a product |
| PUT | `/:id/inventory` | Seller | Update stock quantity |

### Cart — `/api/cart`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | ✅ | Get current cart |
| POST | `/items` | ✅ | Add item to cart |
| PUT | `/items/:productId` | ✅ | Update item quantity |
| DELETE | `/items/:productId` | ✅ | Remove item from cart |
| DELETE | `/` | ✅ | Clear entire cart |

### Orders — `/api/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/checkout` | ✅ | Checkout cart → create order |
| GET | `/` | ✅ | List own orders |
| GET | `/:id` | ✅ | Get order by ID |

### Seller Orders — `/api/shops/mine/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Seller | List orders containing shop's products |
| PUT | `/:id/status` | Seller | Update order status (PENDING→CONFIRMED→SHIPPED) |

### Admin Orders — `/api/admin/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | Admin | List all orders |
| PUT | `/:id/status` | Admin | Update any order status |

### Payments — `/api/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | ✅ | Record a payment for an order |
| GET | `/order/:orderId` | ✅ | Get payment for an order |

### Reviews — `/api/products/:productId/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List reviews for a product |
| POST | `/` | ✅ | Leave a review (one per user per product) |
| DELETE | `/api/reviews/:id` | ✅ | Delete own review |

---

## Project Structure

```
src/
├── app.ts                  # Express app setup
├── index.ts                # Server entry point
├── modules/                # Feature modules
│   ├── auth/
│   ├── users/
│   ├── category/
│   ├── shop/
│   ├── product/
│   ├── cart/
│   ├── order/
│   ├── payment/
│   └── review/
├── middleware/
│   ├── auth.middleware.ts
│   ├── authorize.middleware.ts
│   └── errorHandler.middleware.ts
├── lib/
│   ├── paginate.ts
│   ├── response.ts
│   ├── slug.ts
│   └── swagger.ts
├── types/
│   ├── errors.ts
│   └── express.d.ts
└── tests/
prisma/
├── schema.prisma
├── seed.ts
└── migrations/
```

Each module follows the same pattern: `route → controller → service → repository → validation`

---

## Data Models

```
User ──< Address
User ──  Shop ──< Product ──  Inventory
User ──  Cart ──< CartItem >── Product
User ──< Order ──< OrderItem >── Product
Order ──  Payment
Product ──< Review
```

---

## Auth Flow

1. `POST /api/auth/register` — creates account, returns user
2. `POST /api/auth/login` — returns `accessToken` (15 min) + `refreshToken` (7 days)
3. Pass `Authorization: Bearer <accessToken>` on protected routes
4. `POST /api/auth/refresh` with `{ refreshToken }` to get a new access token
5. `POST /api/auth/logout` with `{ refreshToken }` to invalidate the session

---

## Roles

| Role | Can do |
|---|---|
| `CUSTOMER` | Browse, cart, checkout, review, manage own profile |
| `CUSTOMER` (shop owner) | All of the above + manage own shop, products, and incoming orders |
| `ADMIN` | Everything + approve/suspend shops, manage all orders, manage categories |

A user becomes a shop owner by creating a shop. The shop starts as `PENDING` and must be approved by an admin before products can be listed.

---

## Response Shape

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "message": "",
  "data": { },
  "error": null,
  "meta": { }
}
```

Errors follow the same shape with `success: false`, `data: null`, and `error` containing the message.

Paginated responses include a `meta` object:

```json
"meta": {
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```
