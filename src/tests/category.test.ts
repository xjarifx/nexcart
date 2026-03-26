import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request, app, prisma, cleanDb, registerAndLogin, makeAdmin, expectSuccess, expectError } from "./helpers.js";

let adminToken: string;
let categoryId: string;
let categorySlug: string;

beforeAll(async () => {
  await cleanDb();
  const auth = await registerAndLogin({ email: "admin@example.com" });
  adminToken = auth.token;
  await makeAdmin("admin@example.com");
  // re-login to get fresh token with admin role reflected
  const loginRes = await request(app).post("/api/auth/login").send({
    email: "admin@example.com",
    password: "password123",
  });
  adminToken = loginRes.body.data.accessToken;
});
afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

describe("GET /api/categories", () => {
  it("returns empty list initially", async () => {
    const res = await request(app).get("/api/categories");
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe("POST /api/categories", () => {
  it("creates a category (admin)", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Electronics" });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    categoryId = res.body.data.id;
    categorySlug = res.body.data.slug;
    expect(categorySlug).toBe("electronics");
  });

  it("rejects duplicate name", async () => {
    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Electronics" });
    expect(res.status).toBe(409);
    expectError(res.body);
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).post("/api/categories").send({ name: "Test" });
    expect(res.status).toBe(401);
    expectError(res.body);
  });
});

describe("GET /api/categories/:slug", () => {
  it("returns category by slug", async () => {
    const res = await request(app).get(`/api/categories/${categorySlug}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.slug).toBe(categorySlug);
  });

  it("returns 404 for unknown slug", async () => {
    const res = await request(app).get("/api/categories/does-not-exist");
    expect(res.status).toBe(404);
    expectError(res.body);
  });
});

describe("PUT /api/categories/:id", () => {
  it("updates a category (admin)", async () => {
    const res = await request(app)
      .put(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Consumer Electronics" });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.name).toBe("Consumer Electronics");
  });
});

describe("DELETE /api/categories/:id", () => {
  it("deletes a category (admin)", async () => {
    const res = await request(app)
      .delete(`/api/categories/${categoryId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });
});
