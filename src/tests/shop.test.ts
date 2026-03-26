import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request, app, prisma, cleanDb, registerAndLogin, makeAdmin, expectSuccess, expectError } from "./helpers.js";

let sellerToken: string;
let adminToken: string;
let shopId: string;
let shopSlug: string;

beforeAll(async () => {
  await cleanDb();

  const seller = await registerAndLogin({ email: "seller@example.com" });
  sellerToken = seller.token;

  const admin = await registerAndLogin({ email: "admin@example.com" });
  await makeAdmin("admin@example.com");
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@example.com", password: "password123",
  });
  adminToken = loginRes.body.data.accessToken;
});
afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

describe("POST /api/shops", () => {
  it("creates a shop", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ name: "My Test Shop", description: "A great shop for testing" });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    expect(res.body.data.status).toBe("PENDING");
    shopId = res.body.data.id;
    shopSlug = res.body.data.slug;
  });

  it("rejects creating a second shop", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ name: "Another Shop", description: "Another description here" });
    expect(res.status).toBe(409);
    expectError(res.body);
  });
});

describe("GET /api/shops/mine", () => {
  it("returns own shop", async () => {
    const res = await request(app)
      .get("/api/shops/mine")
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.slug).toBe(shopSlug);
  });
});

describe("PUT /api/shops/mine", () => {
  it("updates own shop", async () => {
    const res = await request(app)
      .put("/api/shops/mine")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ description: "Updated description for the shop" });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.description).toBe("Updated description for the shop");
  });
});

describe("GET /api/shops/:slug (public)", () => {
  it("returns 404 for PENDING shop", async () => {
    const res = await request(app).get(`/api/shops/${shopSlug}`);
    expect(res.status).toBe(404);
    expectError(res.body);
  });

  it("returns shop after approval", async () => {
    await request(app)
      .put(`/api/admin/shops/${shopId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    const res = await request(app).get(`/api/shops/${shopSlug}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.status).toBe("ACTIVE");
  });
});

describe("Admin shop routes", () => {
  it("GET /api/admin/shops — lists all shops", async () => {
    const res = await request(app)
      .get("/api/admin/shops")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("PUT /api/admin/shops/:id/suspend — suspends a shop", async () => {
    const res = await request(app)
      .put(`/api/admin/shops/${shopId}/suspend`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.status).toBe("SUSPENDED");
  });

  it("rejects non-admin access", async () => {
    const res = await request(app)
      .get("/api/admin/shops")
      .set("Authorization", `Bearer ${sellerToken}`);
    expect(res.status).toBe(403);
    expectError(res.body);
  });
});
