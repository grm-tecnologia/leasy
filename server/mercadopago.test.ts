import { describe, expect, it } from "vitest";

describe("Mercado Pago credentials", () => {
  it("should have MERCADOPAGO_ACCESS_TOKEN set", () => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should have VITE_MERCADOPAGO_PUBLIC_KEY set", () => {
    const key = process.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(5);
  });

  it("should be able to reach Mercado Pago API", async () => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      console.warn("Skipping API test: no token");
      return;
    }
    const res = await fetch("https://api.mercadopago.com/v1/payment_methods", {
      headers: { Authorization: `Bearer ${token}` },
    });
    // 200 = valid token, 401 = invalid token
    expect(res.status).toBe(200);
  });

  it("should belong to a real production account (not test_user)", async () => {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!token) {
      console.warn("Skipping account test: no token");
      return;
    }
    const res = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    // Must NOT be a test user
    expect(data.tags).not.toContain("test_user");
    // Nickname should not start with TESTUSER
    expect(data.nickname).not.toMatch(/^TESTUSER/i);
    // Email should not be a test user email
    expect(data.email).not.toMatch(/testuser\.com$/);
  });
});
