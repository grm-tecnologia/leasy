import { describe, expect, it } from "vitest";

// Extract validation functions for testing
// These mirror the same logic used in routers.ts processLeads
const validateCpf = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let rest = 11 - (sum % 11);
  if (rest >= 10) rest = 0;
  if (rest !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  rest = 11 - (sum % 11);
  if (rest >= 10) rest = 0;
  return rest === parseInt(cleaned[10]);
};

const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 13;
};

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
  if (cleaned.length === 10) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
  return phone;
};

const formatCpf = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length === 11) return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`;
  return cpf;
};

describe("CPF Validation", () => {
  it("validates a correct CPF", () => {
    expect(validateCpf("52998224725")).toBe(true);
    expect(validateCpf("529.982.247-25")).toBe(true);
  });

  it("rejects invalid CPFs", () => {
    expect(validateCpf("11111111111")).toBe(false);
    expect(validateCpf("00000000000")).toBe(false);
    expect(validateCpf("12345678901")).toBe(false);
    expect(validateCpf("123")).toBe(false);
    expect(validateCpf("")).toBe(false);
  });

  it("formats CPF correctly", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });
});

describe("Email Validation", () => {
  it("validates correct emails", () => {
    expect(validateEmail("user@example.com")).toBe(true);
    expect(validateEmail("test.user@domain.co.br")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(validateEmail("not-an-email")).toBe(false);
    expect(validateEmail("@domain.com")).toBe(false);
    expect(validateEmail("user@")).toBe(false);
    expect(validateEmail("")).toBe(false);
  });
});

describe("Phone Validation", () => {
  it("validates correct phone numbers", () => {
    expect(validatePhone("11999887766")).toBe(true);
    expect(validatePhone("(11) 99988-7766")).toBe(true);
    expect(validatePhone("1133445566")).toBe(true);
    expect(validatePhone("+5511999887766")).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    expect(validatePhone("123")).toBe(false);
    expect(validatePhone("")).toBe(false);
  });

  it("formats phone numbers correctly", () => {
    expect(formatPhone("11999887766")).toBe("(11) 99988-7766");
    expect(formatPhone("1133445566")).toBe("(11) 3344-5566");
  });
});
