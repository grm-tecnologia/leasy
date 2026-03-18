import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  boolean,
  bigint,
  decimal,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories (Nichos de Leads) ────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }),
  /** JSON array of field definitions for this category: [{name, label, type, filterable}] */
  fieldDefinitions: json("fieldDefinitions").$type<FieldDefinition[]>(),
  leadCount: int("leadCount").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type FieldDefinition = {
  name: string;       // internal key e.g. "nome", "email", "telefone"
  label: string;      // display label e.g. "Nome Completo"
  type: "text" | "number" | "date" | "email" | "phone" | "cpf" | "cnpj" | "url" | "boolean";
  filterable: boolean; // whether this field appears as a filter option
  isContact: boolean;  // whether this field is masked in previews
};

// ─── Leads ───────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  /** JSON object with dynamic fields: { nome: "João", email: "j@x.com", cidade: "SP", ... } */
  data: json("data").$type<Record<string, unknown>>().notNull(),
  /** Upload batch ID to track which upload this lead came from */
  batchId: varchar("batchId", { length: 64 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_leads_category").on(table.categoryId),
  index("idx_leads_batch").on(table.batchId),
]);

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Upload Batches ──────────────────────────────────────────────────
export const uploadBatches = mysqlTable("upload_batches", {
  id: int("id").autoincrement().primaryKey(),
  batchId: varchar("batchId", { length: 64 }).notNull().unique(),
  categoryId: int("categoryId").notNull(),
  fileName: varchar("fileName", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  /** Column mapping suggested by AI: { "Column A": "nome", "Col B": "email" } */
  columnMapping: json("columnMapping").$type<Record<string, string>>(),
  /** New fields suggested by AI */
  suggestedFields: json("suggestedFields").$type<FieldDefinition[]>(),
  status: mysqlEnum("status", ["pending", "mapping", "processing", "completed", "failed"])
    .default("pending")
    .notNull(),
  totalRows: int("totalRows").default(0),
  processedRows: int("processedRows").default(0),
  errorMessage: text("errorMessage"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UploadBatch = typeof uploadBatches.$inferSelect;
export type InsertUploadBatch = typeof uploadBatches.$inferInsert;

// ─── Orders ──────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Total in BRL cents */
  totalCents: int("totalCents").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed", "refunded"])
    .default("pending")
    .notNull(),
  /** Mercado Pago payment ID */
  paymentId: varchar("paymentId", { length: 255 }),
  paymentUrl: varchar("paymentUrl", { length: 1024 }),
  /** JSON with payment details from Mercado Pago */
  paymentDetails: json("paymentDetails").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_orders_user").on(table.userId),
  index("idx_orders_status").on(table.status),
]);

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ─────────────────────────────────────────────────────
export const orderItems = mysqlTable("order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  categoryId: int("categoryId").notNull(),
  /** JSON with the filters the user applied to select these leads */
  filters: json("filters").$type<Record<string, unknown>>(),
  /** Number of leads purchased */
  leadCount: int("leadCount").notNull(),
  /** Price in BRL cents */
  priceCents: int("priceCents").notNull(),
  /** S3 URL to the downloadable file */
  downloadUrl: varchar("downloadUrl", { length: 1024 }),
  downloadKey: varchar("downloadKey", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_order_items_order").on(table.orderId),
]);

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = typeof orderItems.$inferInsert;

// ─── Lead Pricing ────────────────────────────────────────────────────
export const leadPricing = mysqlTable("lead_pricing", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  /** Minimum leads for this tier */
  minQuantity: int("minQuantity").notNull().default(1),
  /** Maximum leads for this tier (null = unlimited) */
  maxQuantity: int("maxQuantity"),
  /** Price per lead in BRL cents */
  pricePerLeadCents: int("pricePerLeadCents").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_pricing_category").on(table.categoryId),
]);

export type LeadPricing = typeof leadPricing.$inferSelect;
export type InsertLeadPricing = typeof leadPricing.$inferInsert;

// ─── Favorites ──────────────────────────────────────────────────────
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_favorites_user").on(table.userId),
  index("idx_favorites_category").on(table.categoryId),
]);

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

// ─── Activity Log ───────────────────────────────────────────────────
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: varchar("entityId", { length: 255 }),
  details: json("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("idx_activity_user").on(table.userId),
  index("idx_activity_action").on(table.action),
  index("idx_activity_created").on(table.createdAt),
]);

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
