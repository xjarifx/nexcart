import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request, app, prisma, cleanDb, registerAndLogin, makeAdmin, expectSuccess, expectError } from "./helpers.js";

let buyerToken: string;
let orderId: string;

beforeAll(async () => {
  await cleanDb();

  await registerAndLogin({ email: "admin@example.com" });
  await makeAdmin("admin@example.com");
  const adminLogin = await request(app).post("/api/auth/login").send({
    email: "admin@example.com", password: "password123",
  });
  const adminToken = adminLogin.body.data.accessToken;

  const catRes = await request(app)
    .post("/api/categories")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Electronics" });
  const categoryId = catRes.body.data.id;

  const seller = await registerAndLogin({ email: "seller@example.com" });
  const shopRes = await request(app)
    .post("/api/shops")
    .set("Authorization", `Bearer ${seller.token}`)
    .send({ name: "Payment Shop", description: "Shop for payment testing purposes" });
  await request(app)
    .put(`/api/admin/shops/${shopRes.body.data.id}/approve`)
    .set("Authorization", `Bearer ${adminToken}`);

  const productRes = await request(app)
    .post("/api/shops/mine/products")
    .set("Authorization", `Bearer ${seller.token}`)
    .send({
      categoryId,
      name: "Payment Product",
      description: "A product for payment testing purposes",
      price: 50,
      brand: "Brand",
      stockQuantity: 10,
    });

  const buyer = await registerAndLogin({ email: "buyer@example.com" });
  buyerToken = buyer.token;

  const addrRes = await request(app)
    .post("/api/users/me/addresses")
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({
      addressLine1: "123 Test St", city: "Cairo",
      state: "Cairo", postalCode: "11511", country: "Egypt",
    });

  await request(app)
    .post("/api/cart/items")
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({ productId: productRes.body.data.id, quantity: 1 });

  const orderRes = await request(app)
    .post("/api/orders")
    .set("Authorization", `Bearer ${buyerToken}`)
    .send({ addressId: addrRes.body.data.id });
  orderId = orderRes.body.data.id;
});
afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

describe("POST /api/payments", () => {
  it("records a payment", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId, paymentMethod: "credit_card", transactionId: `txn_${Date.now()}` });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    expect(res.body.data.status).toBe("COMPLETED");
  });

  it("rejects duplicate payment", async () => {
    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({ orderId, paymentMethod: "credit_card", transactionId: `txn_${Date.now()}` });
    expect(res.status).toBe(409);
    expectError(res.body);
  });
});

describe("GET /api/payments/:orderId", () => {
  it("returns payment for order", async () => {
    const res = await request(app)
      .get(`/api/payments/${orderId}`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.orderId).toBe(orderId);
  });

  it("returns 404 for order with no payment", async () => {
    const res = await request(app)
      .get(`/api/payments/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${buyerToken}`);
    expect(res.status).toBe(404);
    expectError(res.body);
  });
});
