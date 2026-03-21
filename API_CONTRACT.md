# API Contract

Base URL: `/api`  
All request and response bodies are `application/json`.  
Protected routes require: `Authorization: Bearer <token>`

---

## Response Envelope

Every response follows this shape:

**Success**
```json
{
  "data": {},
  "message": "ok"
}
```

**Error**
```json
{
  "error": "Human readable message",
  "details": []
}
```

`details` is an array of Zod field errors — only present on `400` validation failures.

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Authenticated but not allowed |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Internal server error |

---

## Auth

### POST `/api/auth/register`
Create a new account.

**Body**
```json
{
  "name": "string",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "phone": "string"
}
```

**Response `201`**
```json
{
  "data": {
    "token": "string (JWT)",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "createdAt": "ISO 8601"
    }
  },
  "message": "Account created"
}
```

---

### POST `/api/auth/login`
Authenticate and receive a token.

**Body**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`**
```json
{
  "data": {
    "token": "string (JWT)",
    "user": {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "createdAt": "ISO 8601"
    }
  },
  "message": "Login successful"
}
```

---

## Users

### GET `/api/users` 🔒
List all users.

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "email": "string",
      "phone": "string",
      "createdAt": "ISO 8601"
    }
  ],
  "message": "ok"
}
```

---

### GET `/api/users/:userId` 🔒
Get a single user with their addresses, cart, orders, and reviews.

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "createdAt": "ISO 8601",
    "Address": [],
    "Cart": {},
    "Order": [],
    "Review": []
  },
  "message": "ok"
}
```

---

### PUT `/api/users/:userId` 🔒
Update a user. All fields optional.

**Body**
```json
{
  "name": "string?",
  "email": "string?",
  "password": "string?",
  "phone": "string?"
}
```

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "createdAt": "ISO 8601"
  },
  "message": "User updated"
}
```

---

### DELETE `/api/users/:userId` 🔒

**Response `200`**
```json
{
  "data": null,
  "message": "User deleted"
}
```

---

## Categories

### GET `/api/categories`
List all categories.

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "parentId": "uuid | null"
    }
  ],
  "message": "ok"
}
```

---

### GET `/api/categories/:categoryId`

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "parentId": "uuid | null",
    "subcategories": []
  },
  "message": "ok"
}
```

---

### POST `/api/categories` 🔒

**Body**
```json
{
  "name": "string",
  "parentId": "uuid? (optional)"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "parentId": "uuid | null"
  },
  "message": "Category created"
}
```

---

### PUT `/api/categories/:categoryId` 🔒

**Body**
```json
{
  "name": "string?",
  "parentId": "uuid?"
}
```

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "parentId": "uuid | null"
  },
  "message": "Category updated"
}
```

---

### DELETE `/api/categories/:categoryId` 🔒

**Response `200`**
```json
{
  "data": null,
  "message": "Category deleted"
}
```

---

## Products

### GET `/api/products`
List products with inventory and category. Supports filtering and pagination.

**Query Params**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Default: `1` |
| `limit` | number | Default: `20`, max: `100` |
| `categoryId` | uuid | Filter by category |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `search` | string | Matches name or description |

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "description": "string",
        "price": "decimal string",
        "brand": "string",
        "createdAt": "ISO 8601",
        "Category": {
          "id": "uuid",
          "name": "string"
        },
        "Inventory": {
          "stockQuantity": "number",
          "reservedQuantity": "number"
        }
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  },
  "message": "ok"
}
```

---

### GET `/api/products/:productId`

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "price": "decimal string",
    "brand": "string",
    "createdAt": "ISO 8601",
    "Category": {
      "id": "uuid",
      "name": "string",
      "parentId": "uuid | null"
    },
    "Inventory": {
      "stockQuantity": "number",
      "reservedQuantity": "number"
    },
    "Review": []
  },
  "message": "ok"
}
```

---

### POST `/api/products` 🔒

**Body**
```json
{
  "name": "string",
  "description": "string",
  "price": "number (positive)",
  "categoryId": "uuid",
  "brand": "string",
  "stockQuantity": "number (min 0)"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "price": "decimal string",
    "brand": "string",
    "createdAt": "ISO 8601",
    "Category": { "id": "uuid", "name": "string" },
    "Inventory": { "stockQuantity": "number", "reservedQuantity": 0 }
  },
  "message": "Product created"
}
```

---

### PUT `/api/products/:productId` 🔒

**Body**
```json
{
  "name": "string?",
  "description": "string?",
  "price": "number?",
  "categoryId": "uuid?",
  "brand": "string?",
  "stockQuantity": "number?"
}
```

**Response `200`**
```json
{
  "data": { "...same as GET /products/:productId" },
  "message": "Product updated"
}
```

---

### DELETE `/api/products/:productId` 🔒

**Response `200`**
```json
{
  "data": null,
  "message": "Product deleted"
}
```

---

## Cart

All cart routes are scoped to the authenticated user.

### GET `/api/cart` 🔒
Get the user's cart with all items and product details.

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "createdAt": "ISO 8601",
    "CartItem": [
      {
        "id": "uuid",
        "quantity": "number",
        "Product": {
          "id": "uuid",
          "name": "string",
          "price": "decimal string",
          "brand": "string",
          "Inventory": { "stockQuantity": "number" }
        }
      }
    ]
  },
  "message": "ok"
}
```

---

### POST `/api/cart/items` 🔒
Add a product to the cart. If the product already exists in the cart, its quantity is incremented.

**Body**
```json
{
  "productId": "uuid",
  "quantity": "number (min 1)"
}
```

**Response `200`**
```json
{
  "data": { "...same as GET /cart" },
  "message": "Item added to cart"
}
```

**Error `409`** — if product is out of stock.

---

### PUT `/api/cart/items/:itemId` 🔒
Update quantity of a cart item.

**Body**
```json
{
  "quantity": "number (min 1)"
}
```

**Response `200`**
```json
{
  "data": { "...same as GET /cart" },
  "message": "Cart updated"
}
```

---

### DELETE `/api/cart/items/:itemId` 🔒
Remove a single item from the cart.

**Response `200`**
```json
{
  "data": { "...same as GET /cart" },
  "message": "Item removed"
}
```

---

### DELETE `/api/cart` 🔒
Clear all items from the cart.

**Response `200`**
```json
{
  "data": null,
  "message": "Cart cleared"
}
```

---

## Orders

### GET `/api/orders` 🔒
List the authenticated user's orders.

**Query Params**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by status: `pending`, `paid`, `shipped`, `delivered` |
| `page` | number | Default: `1` |
| `limit` | number | Default: `20` |

**Response `200`**
```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "status": "string",
        "totalAmount": "decimal string",
        "createdAt": "ISO 8601",
        "OrderItem": [],
        "Payment": {}
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  },
  "message": "ok"
}
```

---

### GET `/api/orders/:orderId` 🔒
Get a single order. Returns `403` if the order belongs to another user.

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "status": "string",
    "totalAmount": "decimal string",
    "createdAt": "ISO 8601",
    "OrderItem": [
      {
        "id": "uuid",
        "quantity": "number",
        "priceAtPurchase": "decimal string",
        "Product": { "id": "uuid", "name": "string", "brand": "string" }
      }
    ],
    "Payment": {
      "id": "uuid",
      "paymentMethod": "string",
      "status": "string",
      "transactionId": "string",
      "createdAt": "ISO 8601"
    }
  },
  "message": "ok"
}
```

---

### POST `/api/orders` 🔒
Create an order from the current cart contents.

No body required — the cart is read from the authenticated user.

**Response `201`**
```json
{
  "data": { "...same as GET /orders/:orderId" },
  "message": "Order placed"
}
```

**Error `400`** — if cart is empty or any item is out of stock.

---

### PATCH `/api/orders/:orderId/status` 🔒
Update order status.

**Body**
```json
{
  "status": "pending | paid | shipped | delivered"
}
```

**Response `200`**
```json
{
  "data": { "id": "uuid", "status": "string" },
  "message": "Order status updated"
}
```

---

## Payments

### POST `/api/orders/:orderId/payment` 🔒
Record a payment for an order. Order must have status `pending`.

**Body**
```json
{
  "paymentMethod": "card | paypal | bank",
  "transactionId": "string"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "paymentMethod": "string",
    "status": "completed",
    "transactionId": "string",
    "createdAt": "ISO 8601"
  },
  "message": "Payment recorded"
}
```

**Error `400`** — if order is not in `pending` status.

---

### GET `/api/orders/:orderId/payment` 🔒

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "orderId": "uuid",
    "paymentMethod": "string",
    "status": "string",
    "transactionId": "string",
    "createdAt": "ISO 8601"
  },
  "message": "ok"
}
```

---

## Reviews

### GET `/api/products/:productId/reviews`
List all reviews for a product.

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "rating": "number (1-5)",
      "comment": "string",
      "createdAt": "ISO 8601",
      "User": { "id": "uuid", "name": "string" }
    }
  ],
  "message": "ok"
}
```

---

### POST `/api/products/:productId/reviews` 🔒

**Body**
```json
{
  "rating": "number (1-5)",
  "comment": "string"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "rating": "number",
    "comment": "string",
    "createdAt": "ISO 8601",
    "User": { "id": "uuid", "name": "string" }
  },
  "message": "Review submitted"
}
```

---

### PUT `/api/reviews/:reviewId` 🔒
Update own review only. Returns `403` if review belongs to another user.

**Body**
```json
{
  "rating": "number?",
  "comment": "string?"
}
```

**Response `200`**
```json
{
  "data": {
    "id": "uuid",
    "rating": "number",
    "comment": "string",
    "createdAt": "ISO 8601"
  },
  "message": "Review updated"
}
```

---

### DELETE `/api/reviews/:reviewId` 🔒
Delete own review only. Returns `403` if review belongs to another user.

**Response `200`**
```json
{
  "data": null,
  "message": "Review deleted"
}
```

---

## Addresses

### GET `/api/addresses` 🔒
List the authenticated user's addresses.

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "addressLine1": "string",
      "addressLine2": "string",
      "city": "string",
      "state": "string",
      "postalCode": "string",
      "country": "string",
      "isDefault": "boolean"
    }
  ],
  "message": "ok"
}
```

---

### POST `/api/addresses` 🔒

**Body**
```json
{
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "country": "string",
  "isDefault": "boolean? (default: false)"
}
```

**Response `201`**
```json
{
  "data": {
    "id": "uuid",
    "addressLine1": "string",
    "addressLine2": "string",
    "city": "string",
    "state": "string",
    "postalCode": "string",
    "country": "string",
    "isDefault": "boolean"
  },
  "message": "Address created"
}
```

---

### PUT `/api/addresses/:addressId` 🔒
All fields optional.

**Body**
```json
{
  "addressLine1": "string?",
  "addressLine2": "string?",
  "city": "string?",
  "state": "string?",
  "postalCode": "string?",
  "country": "string?"
}
```

**Response `200`**
```json
{
  "data": { "...same as POST /addresses response" },
  "message": "Address updated"
}
```

---

### DELETE `/api/addresses/:addressId` 🔒

**Response `200`**
```json
{
  "data": null,
  "message": "Address deleted"
}
```

---

### PATCH `/api/addresses/:addressId/default` 🔒
Set an address as the default. Clears `isDefault` on all other addresses for this user.

No body required.

**Response `200`**
```json
{
  "data": { "id": "uuid", "isDefault": true },
  "message": "Default address updated"
}
```

---

## Notes

- 🔒 = requires `Authorization: Bearer <token>` header
- All `id` fields are UUIDs
- `price`, `totalAmount`, `priceAtPurchase` are returned as decimal strings (e.g. `"29.99"`) — parse them on the client
- Dates are ISO 8601 strings (e.g. `"2026-03-20T10:00:00.000Z"`)
- Order statuses: `pending` · `paid` · `shipped` · `delivered`
- Payment statuses: `pending` · `completed` · `failed`
- Payment methods: `card` · `paypal` · `bank`
