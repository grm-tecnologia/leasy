import { describe, it, expect } from "vitest";

describe("Resend API Key Validation", () => {
  it("should have RESEND_API_KEY set", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeDefined();
    expect(key).toBeTruthy();
    expect(key!.startsWith("re_")).toBe(true);
  });

  it("should be able to reach Resend API (sending-only key)", async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY not set");

    // Send a test email to validate the key works
    // A 403 with 'validation_error' means the key is valid but domain not verified yet
    // A 401 means the key is invalid
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "test@test.com",
        to: ["test@test.com"],
        subject: "validation",
        html: "<p>test</p>",
      }),
    });

    const data = await res.json() as Record<string, unknown>;
    // 403 with validation_error = key is valid, domain not verified
    // 200 = key is valid and email sent
    // 401 = key is invalid
    expect(res.status).not.toBe(401);
    expect(data).toBeDefined();
  });
});
