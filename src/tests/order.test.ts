import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  request,
  app,
  prisma,
  cleanDb,
  registerAndLogin,
  makeAdmin,
  expectSuccess,
  expectError,
} from "./helpers.js";

let buyerToken: string;
let sellerToken: string;
let adminToken: string;
let addressId: string;
let orderId: string;
let productId: string;

beforeAll(async () => {
  await cleanDb();

  // admin
  await registerAndLogin({ email: "admin@example.com" });
  await makeAdmin("admin@example.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "password123",
  });
  adminToken = adminLogin.body.data.accessToken;

  // category
  const catRes = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Electronics" });
  const categoryId = catRes.body.data.id;

  // seller + shop
  const seller = await registerAndLogin({ email: "seller@example.com" });
  sellerToken = seller.token;
  const shopRes = await request(app)
    .post("/api/shops")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({
      name: "Order Test Shop",
      description: "Shop for order testing purposes",
    });
  await request(app)
    .put(`/api/admin/shops/${shopRes.body.data.id}/approve`)
    .set("Authorization", `Bearer ${adminToken}`);

  // product
  const productRes = await request(app)
    .post("/api/shops/mine/products")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({
      categoryId,
      name: "Order Product",
      description: "A product for order testing purposes",
      price: 100,
      brand: "Brand",
      stockQuantity: 10,
    });
  productId = productRes.body.data.id;

  // buyer
  const buyer = await registerAndLogin({ email: "buyer@example.com" });
  buyerToken = buyer.token;

  // address
  const addrRes = await request(app)
    .post("/api/users/me/addresses")
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({
      addressLine1: "123 Test St",
      city: "Cairo",
      state: "Cairo",
      postalCode: "11511",
      country: "Egypt",
      isDefault: true,
    });
  addressId = addrRes.body.data.id;

  // add to cart
  await request(app)
    .post("/api/cart/items")
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({ productId, quantity: 2 });
});
afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("POST /api/orders (checkout)", () => {
  it("creates an order from cart", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    orderId = res.body.data.id;
    expect(res.body.data.status).toBe("PENDING");
    expect(res.body.data.items.length).toBe(1);
  });

  it("rejects checkout with empty cart", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId });
    expect(res.status).toBe(400);
    expectError(res.body);
  });

  it("rejects invalid addressId", async () => {
    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 });

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ addressId: "00000000-0000-0000-0000-000000000000" });
    expect(res.status).toBe(404);
    expectError(res.body);
  });
});

describe("POST /api/orders (checkout concurrency)", () => {
  it("allows only one checkout to consume the last unit of stock", async () => {
    const lowStockProduct = await request(app)
      .post("/api/shops/mine/products")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        categoryId: (
          await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: `Concurrency-${Date.now()}` })
        ).body.data.id,
        name: `Concurrency Product ${Date.now()}`,
        description: "Product used to verify atomic stock updates",
        price: 50,
        brand: "Brand",
        stockQuantity: 1,
      });

    const lowStockProductId = lowStockProduct.body.data.id;

    const firstBuyer = await registerAndLogin({
      email: `buyer_a_${Date.now()}@example.com`,
    });
    const secondBuyer = await registerAndLogin({
      email: `buyer_b_${Date.now()}@example.com`,
    });

    const firstAddress = await request(app)
      .post("/api/users/me/addresses")
      .set("Authorization", `Bearer ${firstBuyer.token}`)
      .send({
        addressLine1: "1 Atomic St",
        city: "Cairo",
        state: "Cairo",
        postalCode: "11511",
        country: "Egypt",
        isDefault: true,
      });

    const secondAddress = await request(app)
      .post("/api/users/me/addresses")
      .set("Authorization", `Bearer ${secondBuyer.token}`)
      .send({
        addressLine1: "2 Atomic St",
        city: "Cairo",
        state: "Cairo",
        postalCode: "11511",
        country: "Egypt",
        isDefault: true,
      });

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${firstBuyer.token}`)
      .send({ productId: lowStockProductId, quantity: 1 });

    await request(app)
      .post("/api/cart/items")
      .set("Authorization", `Bearer ${secondBuyer.token}`)
      .send({ productId: lowStockProductId, quantity: 1 });

    const [firstCheckout, secondCheckout] = await Promise.all([
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${firstBuyer.token}`)
        .send({ addressId: firstAddress.body.data.id }),
      request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${secondBuyer.token}`)
        .send({ addressId: secondAddress.body.data.id }),
    ]);

    expect([firstCheckout.status, secondCheckout.status].sort()).toEqual([
      201, 409,
    ]);

    const orderCount = await prisma.order.count({
      where: { items: { some: { productId: lowStockProductId } } },
    });
    expect(orderCount).toBe(1);
  });
});

describe("GET /api/orders", () => {
  it("returns buyer order history", async () => {
    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});

describe("GET /api/orders/:id", () => {
  it("returns order by id", async () => {
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.id).toBe(orderId);
  });

  it("rejects access to another user's order", async () => {
    const other = await registerAndLogin({ email: "other@example.com" });
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${other.token}`);
    expect(res.status).toBe(403);
    expectError(res.body);
  });
});

describe("Seller order management", () => {
  it("GET /api/shops/mine/orders — returns shop orders", async () => {
    const res = await request(app)
      .get("/api/shops/mine/orders")
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("PUT /api/shops/mine/orders/:id — confirms order", async () => {
    const res = await request(app)
      .put(`/api/shops/mine/orders/${orderId}`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "CONFIRMED" });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.status).toBe("CONFIRMED");
  });

  it("rejects invalid transition", async () => {
    const res = await request(app)
      .put(`/api/shops/mine/orders/${orderId}`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "DELIVERED" });
    expect(res.status).toBe(400);
    expectError(res.body);
  });
});

describe("Admin order management", () => {
  it("GET /api/admin/orders — returns all orders", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });

  it("PUT /api/admin/orders/:id — updates order status", async () => {
    const res = await request(app)
      .put(`/api/admin/orders/${orderId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "SHIPPED" });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.status).toBe("SHIPPED");
  });
});
