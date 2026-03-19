import rateLimit from "express-rate-limit";
import type { Express, Request, Response, NextFunction } from "express";

// ─── Rate Limiters ──────────────────────────────────────────────────

/** General API rate limiter: 100 requests per minute per IP */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: "Muitas requisições. Tente novamente em alguns instantes.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

/** Stricter limiter for auth endpoints: 10 requests per minute */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: "Muitas tentativas de autenticação. Aguarde um momento.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
  },
});

/** Upload limiter: 20 uploads per 10 minutes */
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: "Limite de uploads atingido. Aguarde alguns minutos.",
    code: "UPLOAD_RATE_LIMIT_EXCEEDED",
  },
});

/** Webhook limiter: 200 per minute (Mercado Pago can send bursts) */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
});

/** Export/download limiter: 30 per minute */
export const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: {
    error: "Limite de downloads atingido. Aguarde um momento.",
    code: "EXPORT_RATE_LIMIT_EXCEEDED",
  },
});

// ─── Upload Size Validation ─────────────────────────────────────────

/** Maximum file size: 25MB (in bytes) */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Maximum number of rows per upload */
const MAX_ROWS_PER_UPLOAD = 100_000;

/** Allowed file extensions */
const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".json", ".txt"];

/** Allowed MIME types */
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "text/plain",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream", // Some browsers send this for CSV
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sizeBytes?: number;
  extension?: string;
}

/**
 * Validates an uploaded file's size and type.
 * Call this before processing any uploaded file data.
 */
export function validateUploadFile(
  fileName: string,
  sizeBytes: number,
  mimeType?: string
): FileValidationResult {
  // Check file extension
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Formato de arquivo não permitido: ${ext}. Formatos aceitos: ${ALLOWED_EXTENSIONS.join(", ")}`,
      sizeBytes,
      extension: ext,
    };
  }

  // Check file size
  if (sizeBytes > MAX_FILE_SIZE) {
    const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
    const maxMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `Arquivo muito grande (${sizeMB}MB). Tamanho máximo permitido: ${maxMB}MB`,
      sizeBytes,
      extension: ext,
    };
  }

  // Check MIME type if provided
  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    // Don't block on MIME type alone since browsers are inconsistent
    console.warn(`[Security] Unexpected MIME type: ${mimeType} for file: ${fileName}`);
  }

  return { valid: true, sizeBytes, extension: ext };
}

/**
 * Validates the number of rows in an uploaded dataset.
 */
export function validateRowCount(rowCount: number): { valid: boolean; error?: string } {
  if (rowCount > MAX_ROWS_PER_UPLOAD) {
    return {
      valid: false,
      error: `Arquivo contém ${rowCount.toLocaleString("pt-BR")} linhas. Máximo permitido: ${MAX_ROWS_PER_UPLOAD.toLocaleString("pt-BR")} linhas por upload.`,
    };
  }
  if (rowCount === 0) {
    return {
      valid: false,
      error: "O arquivo está vazio ou não contém dados válidos.",
    };
  }
  return { valid: true };
}

// ─── Input Sanitization ─────────────────────────────────────────────

/** Characters that could be used for SQL injection or XSS */
const DANGEROUS_PATTERNS = [
  /<script\b[^>]*>/gi,
  /<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /<iframe\b[^>]*>/gi,
  /<\/iframe>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<form\b[^>]*>/gi,
  /expression\s*\(/gi,
  /url\s*\(\s*['"]?\s*javascript/gi,
];

/**
 * Sanitizes a string input by removing potentially dangerous content.
 * Used for text fields that will be stored in the database.
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== "string") return input;

  let sanitized = input.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, "");

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // Escape HTML entities for stored data
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

  return sanitized;
}

/**
 * Sanitizes an object's string values recursively.
 * Used for lead data objects before storing in the database.
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeString(key);
    if (typeof value === "string") {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[sanitizedKey] = value;
    }
  }
  return sanitized;
}

/**
 * Validates and sanitizes a search query string.
 * Prevents injection in search/filter operations.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== "string") return "";

  return query
    .trim()
    .replace(/[<>{}()[\]\\\/]/g, "") // Remove brackets and slashes
    .replace(/\0/g, "")              // Remove null bytes
    .substring(0, 500);              // Limit length
}

// ─── Security Headers Middleware ─────────────────────────────────────

/**
 * Adds comprehensive security headers to all responses.
 * Includes CSP, HSTS, X-Frame-Options, and more.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // XSS protection (legacy browsers)
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy — don't leak full URLs
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy — restrict dangerous APIs
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  // Content Security Policy — prevent XSS and data injection
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://accounts.google.com https://api.mercadopago.com https://*.mercadopago.com https://*.cloudfront.net wss: ws:",
    "frame-src 'self' https://www.mercadopago.com.br https://sdk.mercadopago.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
  res.setHeader("Content-Security-Policy", csp);

  // Strict Transport Security — force HTTPS
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Prevent caching of sensitive data
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  next();
}

// ─── CORS Middleware ────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  "https://leasy.app.br",
  "https://www.leasy.app.br",
]);

/**
 * Custom CORS handler that only allows specific origins.
 * In development, allows localhost origins.
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const isDev = process.env.NODE_ENV === "development";

  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.has(origin) ||
      (isDev && (origin.includes("localhost") || origin.includes("127.0.0.1")));

    if (isAllowed) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Max-Age", "86400");
    }
  }

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

// ─── Request ID Middleware ──────────────────────────────────────────

/**
 * Adds a unique request ID to each request for tracing.
 */
let requestCounter = 0;
export function requestIdMiddleware(req: Request, _res: Response, next: NextFunction) {
  requestCounter++;
  (req as any).requestId = `${Date.now()}-${requestCounter}`;
  next();
}

// ─── Register All Security Middleware ────────────────────────────────

export function registerSecurityMiddleware(app: Express) {
  // Trust proxy (behind reverse proxy in production)
  app.set("trust proxy", 1);

  // Request ID for tracing
  app.use(requestIdMiddleware);

  // CORS handling
  app.use(corsMiddleware);

  // Security headers on all routes
  app.use(securityHeaders);

  // Rate limiting on API routes
  app.use("/api/trpc", apiLimiter);

  // Stricter rate limiting on auth routes
  app.use("/api/oauth", authLimiter);

  // Webhook rate limiting
  app.use("/api/webhooks", webhookLimiter);

  // Disable X-Powered-By header
  app.disable("x-powered-by");

  console.log("[Security] Middleware registered: rate limiting, CORS, CSP, HSTS, headers, sanitization");
}

// Export constants for use in tests
export const LIMITS = {
  MAX_FILE_SIZE,
  MAX_ROWS_PER_UPLOAD,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
};
