# E-Commerce API — Vision

A RESTful e-commerce backend built to serve a frontend client through a clean, predictable HTTP interface. The API owns the full shopping lifecycle — from a guest browsing products to a customer completing a purchase and leaving a review. It is the single source of truth for all business logic. The frontend is just a consumer.

## Domain

The domain is already defined in the schema: users, products, categories, inventory, cart, orders, payments, reviews, addresses. Every model has a clear responsibility and a clear relationship to the others. The implementation work is building the API surface on top of what's already there.

## Architecture

```
route → controller → service → repository
```

This layering is intentional and should be respected throughout. Routes declare endpoints and apply middleware. Controllers handle the HTTP contract — parsing input, returning output, nothing else. Services own business logic and validation. Repositories own data access. No layer reaches past its neighbor.

Zod validates at the service boundary. Prisma queries are isolated in repositories and never leak into services as raw SQL or complex query objects. This keeps each layer independently readable and testable.

## Modules

- **Auth** — the entry point for every user. Register, login, and issue a signed JWT. The token is the identity contract for every subsequent request.
- **User** — a user's relationship with their own account. Profile, password, and a managed list of shipping addresses.
- **Product** — the catalog. Products belong to categories, carry a price, a brand, and a description. Filterable, searchable, paginated. The face of the store.
- **Category** — hierarchical by design. A category can have a parent, enabling a tree structure. Admin-managed, publicly readable.
- **Cart** — a persistent, per-user cart that lives between sessions. Created lazily on first use. Items carry a product reference and a quantity. The cart is the staging area before commitment.
- **Order** — the moment a cart becomes a commitment. Checkout is a transaction: cart items become order items with prices locked at purchase time, inventory decrements, cart clears. All or nothing. Orders have a status lifecycle managed by admins.
- **Payment** — decoupled from the order intentionally. A payment is recorded against an order. The implementation starts simple and gateway-agnostic, designed so a real provider like Stripe can be wired in later without touching the order logic.
- **Review** — customers speak about products they've experienced. One review per user per product. Publicly readable, authenticated to write.
- **Inventory** — stock is tracked per product with a reserved quantity separate from available stock. Decremented atomically during checkout to prevent overselling.

## Access Control

Two roles: CUSTOMER and ADMIN. Authentication answers "who are you" — verified on every protected request via JWT. Authorization answers "what are you allowed to do" — enforced at the route level for admin operations. These are two distinct middleware concerns and stay that way.

## Principles

- Every checkout is a database transaction. Partial state is not acceptable.
- Every list endpoint is paginated. Unbounded queries don't ship.
- Every error has a consistent shape. Clients should never have to guess the error format.
- Swagger documentation lives next to the routes and is updated as routes are added. It is not an afterthought.
- The payment layer is intentionally thin and swappable. Business logic does not couple to a payment provider.
- The API is stateless. The JWT carries identity. No sessions, no server-side state.
