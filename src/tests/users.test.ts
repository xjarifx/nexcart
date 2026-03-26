import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request, app, prisma, cleanDb, registerAndLogin, expectSuccess, expectError } from "./helpers.js";

let token: string;

beforeAll(async () => {
  await cleanDb();
  const auth = await registerAndLogin({ email: "user@example.com" });
  token = auth.token;
});
afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

describe("GET /api/users/me", () => {
  it("returns current user", async () => {
    const res = await request(app).get("/api/users/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data).not.toHaveProperty("password");
  });

  it("rejects unauthenticated request", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expectError(res.body);
  });
});

describe("PUT /api/users/me", () => {
  it("updates name", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.name).toBe("Updated Name");
  });

  it("rejects empty body", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expectError(res.body);
  });
});

describe("PUT /api/users/me/password", () => {
  it("updates password with correct current password", async () => {
    const res = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "password123", newPassword: "newpassword123" });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });

  it("rejects wrong current password", async () => {
    const res = await request(app)
      .put("/api/users/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrongpassword", newPassword: "newpassword123" });
    expect(res.status).toBe(401);
    expectError(res.body);
  });
});

describe("Addresses", () => {
  let addressId: string;

  it("POST /api/users/me/addresses — adds an address", async () => {
    const res = await request(app)
      .post("/api/users/me/addresses")
      .set("Authorization", `Bearer ${token}`)
      .send({
        addressLine1: "123 Main St",
        city: "Cairo",
        state: "Cairo",
        postalCode: "11511",
        country: "Egypt",
        isDefault: true,
      });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    addressId = res.body.data.id;
  });

  it("GET /api/users/me/addresses — lists addresses", async () => {
    const res = await request(app)
      .get("/api/users/me/addresses")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("PUT /api/users/me/addresses/:id — updates address", async () => {
    const res = await request(app)
      .put(`/api/users/me/addresses/${addressId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ city: "Alexandria" });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data.city).toBe("Alexandria");
  });

  it("DELETE /api/users/me/addresses/:id — deletes address", async () => {
    const res = await request(app)
      .delete(`/api/users/me/addresses/${addressId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });

  it("returns 404 for non-existent address", async () => {
    const res = await request(app)
      .delete(`/api/users/me/addresses/00000000-0000-0000-0000-000000000000`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expectError(res.body);
  });
});
