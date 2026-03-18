export const ENV = {
  // App
  appUrl: process.env.APP_URL ?? "https://leasy.app.br",
  isProduction: process.env.NODE_ENV === "production",

  // Auth
  cookieSecret: process.env.JWT_SECRET ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "",

  // Database
  databaseUrl: process.env.DATABASE_URL ?? "",

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",

  // Mercado Pago
  mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",

  // Resend (Email)
  resendApiKey: process.env.RESEND_API_KEY ?? "",

  // Storage (local or S3)
  storageMode: (process.env.STORAGE_MODE ?? "local") as "local" | "s3",
  storagePath: process.env.STORAGE_PATH ?? "/var/www/leasy/storage",
  storageUrl: process.env.STORAGE_URL ?? "https://leasy.app.br/storage",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  s3AccessKey: process.env.S3_ACCESS_KEY ?? "",
  s3SecretKey: process.env.S3_SECRET_KEY ?? "",

  // Legacy compat (used in db.ts for admin auto-promotion)
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
};
