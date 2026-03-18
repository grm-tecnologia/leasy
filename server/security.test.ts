import { describe, expect, it } from "vitest";
import {
  sanitizeString,
  sanitizeObject,
  sanitizeSearchQuery,
  validateUploadFile,
  validateRowCount,
  LIMITS,
} from "./security";

describe("sanitizeString", () => {
  it("removes script tags", () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeString(input);
    expect(result).not.toContain("<script>");
    expect(result).not.toContain("</script>");
  });

  it("removes javascript: protocol", () => {
    const input = "javascript:alert(1)";
    const result = sanitizeString(input);
    expect(result).not.toContain("javascript:");
  });

  it("removes null bytes", () => {
    const input = "Hello\0World";
    const result = sanitizeString(input);
    expect(result).not.toContain("\0");
  });

  it("escapes HTML entities", () => {
    const result = sanitizeString("<div>test</div>");
    expect(result).toContain("&lt;");
    expect(result).toContain("&gt;");
  });

  it("trims whitespace", () => {
    const result = sanitizeString("  hello  ");
    expect(result).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("handles normal text without modification", () => {
    const result = sanitizeString("João da Silva");
    expect(result).toBe("Jo\u00E3o da Silva");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes all string values in an object", () => {
    const input = {
      name: "João",
      email: '<script>alert("xss")</script>test@email.com',
      age: 30,
    };
    const result = sanitizeObject(input);
    expect(result.name).toBe("Jo\u00E3o");
    expect(result.email).not.toContain("<script>");
    expect(result.age).toBe(30);
  });

  it("handles nested objects", () => {
    const input = {
      data: {
        name: '<img onerror="alert(1)">',
      },
    };
    const result = sanitizeObject(input);
    const nested = result.data as Record<string, unknown>;
    expect(nested.name).not.toContain("onerror=");
  });

  it("preserves non-string values", () => {
    const input = { count: 42, active: true, tags: ["a", "b"] };
    const result = sanitizeObject(input);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.tags).toEqual(["a", "b"]);
  });
});

describe("sanitizeSearchQuery", () => {
  it("removes dangerous characters", () => {
    const result = sanitizeSearchQuery("test<script>alert(1)</script>");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("removes brackets and slashes", () => {
    const result = sanitizeSearchQuery("test{DROP TABLE}[users]");
    expect(result).not.toContain("{");
    expect(result).not.toContain("}");
    expect(result).not.toContain("[");
    expect(result).not.toContain("]");
  });

  it("limits length to 500 characters", () => {
    const longQuery = "a".repeat(1000);
    const result = sanitizeSearchQuery(longQuery);
    expect(result.length).toBe(500);
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeSearchQuery("")).toBe("");
  });

  it("preserves normal search terms", () => {
    expect(sanitizeSearchQuery("João São Paulo")).toBe("João São Paulo");
  });
});

describe("validateUploadFile", () => {
  it("accepts valid CSV file", () => {
    const result = validateUploadFile("leads.csv", 1024);
    expect(result.valid).toBe(true);
  });

  it("accepts valid Excel file", () => {
    const result = validateUploadFile("data.xlsx", 5 * 1024 * 1024);
    expect(result.valid).toBe(true);
  });

  it("accepts valid JSON file", () => {
    const result = validateUploadFile("leads.json", 2048);
    expect(result.valid).toBe(true);
  });

  it("accepts valid TXT file", () => {
    const result = validateUploadFile("data.txt", 512);
    expect(result.valid).toBe(true);
  });

  it("rejects unsupported file extension", () => {
    const result = validateUploadFile("malware.exe", 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("não permitido");
  });

  it("rejects PHP files", () => {
    const result = validateUploadFile("shell.php", 100);
    expect(result.valid).toBe(false);
  });

  it("rejects files exceeding size limit", () => {
    const result = validateUploadFile("huge.csv", 30 * 1024 * 1024);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("grande");
  });

  it("accepts files at exactly the size limit", () => {
    const result = validateUploadFile("exact.csv", LIMITS.MAX_FILE_SIZE);
    expect(result.valid).toBe(true);
  });
});

describe("validateRowCount", () => {
  it("accepts valid row count", () => {
    const result = validateRowCount(5000);
    expect(result.valid).toBe(true);
  });

  it("rejects zero rows", () => {
    const result = validateRowCount(0);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("vazio");
  });

  it("rejects rows exceeding limit", () => {
    const result = validateRowCount(LIMITS.MAX_ROWS_PER_UPLOAD + 1);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("linhas");
  });

  it("accepts rows at exactly the limit", () => {
    const result = validateRowCount(LIMITS.MAX_ROWS_PER_UPLOAD);
    expect(result.valid).toBe(true);
  });
});
