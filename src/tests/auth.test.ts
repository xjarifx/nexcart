import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request, app, prisma, cleanDb, registerUser, loginUser, expectSuccess, expectError } from "./helpers.js";

beforeAll(async () => { await cleanDb(); });
afterAll(async () => { await cleanDb(); await prisma.$disconnect(); });

describe("POST /api/auth/register", () => {
  it("registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      phone: "01012345678",
    });
    expect(res.status).toBe(201);
    expectSuccess(res.body);
    expect(res.body.data).not.toHaveProperty("password");
    expect(res.body.data.email).toBe("jane@example.com");
  });

  it("rejects duplicate email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      phone: "01012345678",
    });
    expect(res.status).toBe(409);
    expectError(res.body);
  });

  it("rejects invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "not-an-email",
      password: "password123",
      phone: "01012345678",
    });
    expect(res.status).toBe(400);
    expectError(res.body);
  });

  it("rejects short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Jane",
      email: "jane2@example.com",
      password: "short",
      phone: "01012345678",
    });
    expect(res.status).toBe(400);
    expectError(res.body);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "jane@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data).toHaveProperty("accessToken");
    expect(res.body.data).toHaveProperty("refreshToken");
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "jane@example.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    expectError(res.body);
  });

  it("rejects unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
    expectError(res.body);
  });
});

describe("POST /api/auth/refresh", () => {
  it("returns a new access token", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "jane@example.com",
      password: "password123",
    });
    const { refreshToken } = loginRes.body.data;

    const res = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
    expect(res.body.data).toHaveProperty("accessToken");
  });

  it("rejects invalid refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh").send({ refreshToken: "invalid" });
    expect(res.status).toBe(401);
    expectError(res.body);
  });
});

describe("POST /api/auth/logout", () => {
  it("logs out successfully", async () => {
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "jane@example.com",
      password: "password123",
    });
    const { accessToken, refreshToken } = loginRes.body.data;

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expectSuccess(res.body);
  });
});
