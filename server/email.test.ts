import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    resendApiKey: "re_test_key_123",
  },
}));

// We'll test the email template functions by importing and checking output
describe("Email Module", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sendWelcomeEmail calls Resend API with correct payload", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "email_123" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { sendWelcomeEmail } = await import("./email");
    const result = await sendWelcomeEmail("test@example.com", "João");

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");

    const body = JSON.parse(options.body);
    expect(body.from).toContain("Leasy");
    expect(body.to).toEqual(["test@example.com"]);
    expect(body.subject).toContain("Bem-vindo");
    expect(body.html).toContain("João");
    expect(body.html).toContain("Leasy");
    expect(body.html).toContain("Acessar Meu Painel");
  });

  it("sendOrderConfirmationEmail includes order details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "email_456" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { sendOrderConfirmationEmail } = await import("./email");
    const result = await sendOrderConfirmationEmail(
      "cliente@example.com",
      "Maria",
      42,
      9000,
      [
        { categoryName: "Imobiliário", leadCount: 50, priceCents: 4500 },
        { categoryName: "Consórcios", leadCount: 50, priceCents: 4500 },
      ]
    );

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toContain("#42");
    expect(body.html).toContain("Maria");
    expect(body.html).toContain("#42");
    expect(body.html).toContain("Imobiliário");
    expect(body.html).toContain("Consórcios");
    expect(body.html).toContain("90,00");
  });

  it("sendPaymentApprovedEmail includes payment details", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "email_789" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { sendPaymentApprovedEmail } = await import("./email");
    const result = await sendPaymentApprovedEmail(
      "cliente@example.com",
      "Pedro",
      99,
      15000,
      3
    );

    expect(result).toBe(true);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.subject).toContain("#99");
    expect(body.subject).toContain("aprovado");
    expect(body.html).toContain("Pedro");
    expect(body.html).toContain("150,00");
    expect(body.html).toContain("3 arquivos");
    expect(body.html).toContain("Baixar Meus Leads");
  });

  it("returns false when API key is missing", async () => {
    // Reset modules to re-import with empty key
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "" },
    }));

    const { sendWelcomeEmail } = await import("./email");
    const result = await sendWelcomeEmail("test@example.com", "Test");
    expect(result).toBe(false);
  });

  it("returns false when Resend API returns error", async () => {
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "re_test_key" },
    }));

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: "Unauthorized" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { sendWelcomeEmail } = await import("./email");
    const result = await sendWelcomeEmail("test@example.com", "Test");
    expect(result).toBe(false);
  });

  it("returns false when fetch throws network error", async () => {
    vi.resetModules();
    vi.doMock("./_core/env", () => ({
      ENV: { resendApiKey: "re_test_key" },
    }));

    const mockFetch = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", mockFetch);

    const { sendWelcomeEmail } = await import("./email");
    const result = await sendWelcomeEmail("test@example.com", "Test");
    expect(result).toBe(false);
  });

  it("email templates include LGPD links", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "email_lgpd" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { sendWelcomeEmail } = await import("./email");
    await sendWelcomeEmail("test@example.com", "Test");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.html).toContain("privacidade");
    expect(body.html).toContain("termos");
  });
});
