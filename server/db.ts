import { eq, and, sql, desc, asc, like, inArray, gte, lte, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  categories, InsertCategory, Category, FieldDefinition,
  leads, InsertLead,
  uploadBatches, InsertUploadBatch,
  orders, InsertOrder,
  orderItems, InsertOrderItem,
  leadPricing, InsertLeadPricing,
  favorites, InsertFavorite,
  activityLog, InsertActivityLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.email && user.email === ENV.adminEmail) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(page = 1, pageSize = 20, search?: string) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };
  const conditions = search ? like(users.name, `%${search}%`) : undefined;
  const totalResult = await db.select({ count: count() }).from(users).where(conditions);
  const total = totalResult[0]?.count ?? 0;
  const offset = (page - 1) * pageSize;
  const rows = await db.select().from(users)
    .where(conditions)
    .orderBy(desc(users.createdAt))
    .limit(pageSize).offset(offset);
  return { users: rows, total };
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Client Metrics ─────────────────────────────────────────────────

export async function getClientDashboardMetrics(userId: number) {
  const db = await getDb();
  if (!db) return {
    totalLeadsBought: 0, totalSpent: 0, totalOrders: 0, paidOrders: 0,
    pendingOrders: 0, categoryBreakdown: [], monthlySpending: [], recentOrders: [],
  };

  // Run all queries in parallel for maximum speed
  const [leadsResult, spentResult, orderCountResult, paidCountResult, pendingCountResult, catBreakdown, monthlySpending, recentOrders] = await Promise.all([
    // Total leads bought (from paid orders)
    db.select({
      total: sql<number>`COALESCE(SUM(${orderItems.leadCount}), 0)`,
    }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.userId, userId), eq(orders.status, "paid"))),
    // Total spent
    db.select({
      total: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)`,
    }).from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, "paid"))),
    // Total orders
    db.select({ count: count() }).from(orders).where(eq(orders.userId, userId)),
    // Paid orders
    db.select({ count: count() }).from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, "paid"))),
    // Pending orders
    db.select({ count: count() }).from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.status, "pending"))),
    // Category breakdown
    db.select({
      categoryId: orderItems.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      totalLeads: sql<number>`SUM(${orderItems.leadCount})`,
      totalSpent: sql<number>`SUM(${orderItems.priceCents})`,
    }).from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(categories, eq(orderItems.categoryId, categories.id))
      .where(and(eq(orders.userId, userId), eq(orders.status, "paid")))
      .groupBy(orderItems.categoryId, categories.name, categories.color),
    // Monthly spending (last 6 months) - use raw SQL to avoid only_full_group_by issue
    db.execute(sql`SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, SUM(totalCents) as total, COUNT(*) as orderCount FROM orders WHERE userId = ${userId} AND status = 'paid' AND createdAt >= DATE_SUB(NOW(), INTERVAL 6 MONTH) GROUP BY DATE_FORMAT(createdAt, '%Y-%m') ORDER BY month ASC`),
    // Recent orders
    db.select({
      orderId: orders.id,
      totalCents: orders.totalCents,
      status: orders.status,
      createdAt: orders.createdAt,
    }).from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(5),
  ]);

  return {
    totalLeadsBought: leadsResult[0]?.total ?? 0,
    totalSpent: spentResult[0]?.total ?? 0,
    totalOrders: orderCountResult[0]?.count ?? 0,
    paidOrders: paidCountResult[0]?.count ?? 0,
    pendingOrders: pendingCountResult[0]?.count ?? 0,
    categoryBreakdown: catBreakdown,
    monthlySpending: (Array.isArray(monthlySpending) ? monthlySpending : (monthlySpending as any)?.[0] ?? []) as Array<{month: string; total: number; orderCount: number}>,
    recentOrders,
  };
}

// ─── Categories ──────────────────────────────────────────────────────

export async function getAllCategories(onlyActive = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = onlyActive ? eq(categories.isActive, true) : undefined;
  return db.select().from(categories).where(conditions).orderBy(asc(categories.name));
}

export async function getCategoryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0];
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function updateCategoryLeadCount(categoryId: number) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select({ count: count() }).from(leads)
    .where(and(eq(leads.categoryId, categoryId), eq(leads.isActive, true)));
  const total = result[0]?.count ?? 0;
  await db.update(categories).set({ leadCount: total }).where(eq(categories.id, categoryId));
}

// ─── Leads ───────────────────────────────────────────────────────────

export async function insertLeads(leadsData: InsertLead[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (leadsData.length === 0) return;
  // Insert in batches of 500
  const batchSize = 500;
  for (let i = 0; i < leadsData.length; i += batchSize) {
    const batch = leadsData.slice(i, i + batchSize);
    await db.insert(leads).values(batch);
  }
}

// Map of field names to their generated column names for optimized search
const GENERATED_COLUMN_MAP: Record<string, string> = {
  nome: "_search_nome",
  email: "_search_email",
  telefone: "_search_telefone",
  cidade: "_search_cidade",
  estado: "_search_estado",
};

/**
 * Build a WHERE condition for a filter key/value pair.
 * Uses generated columns (indexed) when available, falls back to JSON_EXTRACT.
 */
function buildFilterCondition(key: string, value: string) {
  const trimmed = value.trim().toLowerCase();
  const genCol = GENERATED_COLUMN_MAP[key];

  if (genCol) {
    // Use indexed generated column for fast lookup
    if (key === "estado" && trimmed.length === 2) {
      // Exact match for estado (UF)
      return sql`${sql.raw(genCol)} = ${trimmed.toUpperCase()}`;
    }
    if (key === "telefone") {
      // Numeric-only comparison for phone
      const numericValue = trimmed.replace(/\D/g, "");
      return sql`${sql.raw(genCol)} LIKE ${`%${numericValue}%`}`;
    }
    // LIKE on generated column (still uses index for prefix matches)
    return sql`${sql.raw(genCol)} LIKE ${`%${trimmed}%`}`;
  }

  // Fallback: JSON_EXTRACT for non-indexed fields
  return sql`LOWER(JSON_UNQUOTE(JSON_EXTRACT(data, ${`$.${key}`}))) LIKE ${`%${trimmed}%`}`;
}

export async function getLeadsForCategory(
  categoryId: number,
  filters: Record<string, string> = {},
  page = 1,
  pageSize = 20
) {
  const db = await getDb();
  if (!db) return { leads: [], total: 0 };

  // Build dynamic WHERE conditions — uses generated columns when available
  const conditions = [eq(leads.categoryId, categoryId), eq(leads.isActive, true)];

  for (const [key, value] of Object.entries(filters)) {
    if (value && value.trim()) {
      conditions.push(buildFilterCondition(key, value));
    }
  }

  const whereClause = and(...conditions);

  const totalResult = await db.select({ count: count() }).from(leads).where(whereClause);
  const total = totalResult[0]?.count ?? 0;

  const offset = (page - 1) * pageSize;
  const rows = await db.select().from(leads)
    .where(whereClause)
    .orderBy(desc(leads.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { leads: rows, total };
}

export async function deleteLead(leadId: number) {
  const db = await getDb();
  if (!db) return;
  const lead = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (lead.length > 0) {
    await db.delete(leads).where(eq(leads.id, leadId));
    await updateCategoryLeadCount(lead[0].categoryId);
  }
}

export async function getLeadsByIds(ids: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (ids.length === 0) return [];
  return db.select().from(leads).where(inArray(leads.id, ids));
}

export async function countLeadsForFilter(
  categoryId: number,
  filters: Record<string, string> = {}
) {
  const db = await getDb();
  if (!db) return 0;

  const conditions = [eq(leads.categoryId, categoryId), eq(leads.isActive, true)];
  for (const [key, value] of Object.entries(filters)) {
    if (value && value.trim()) {
      conditions.push(buildFilterCondition(key, value));
    }
  }

  const result = await db.select({ count: count() }).from(leads).where(and(...conditions));
  return result[0]?.count ?? 0;
}

export async function getDistinctValues(categoryId: number, fieldName: string) {
  const db = await getDb();
  if (!db) return [];

  const genCol = GENERATED_COLUMN_MAP[fieldName];
  let result;

  if (genCol) {
    // Use indexed generated column for fast DISTINCT
    result = await db.execute(
      sql`SELECT DISTINCT ${sql.raw(genCol)} as val 
          FROM leads 
          WHERE categoryId = ${categoryId} AND isActive = true 
          AND ${sql.raw(genCol)} IS NOT NULL AND ${sql.raw(genCol)} != ''
          ORDER BY val
          LIMIT 100`
    );
  } else {
    // Fallback: JSON_EXTRACT for non-indexed fields
    result = await db.execute(
      sql`SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(data, ${`$.${fieldName}`})) as val 
          FROM leads 
          WHERE categoryId = ${categoryId} AND isActive = true 
          AND JSON_EXTRACT(data, ${`$.${fieldName}`}) IS NOT NULL
          ORDER BY val
          LIMIT 100`
    );
  }

  return (result as any)[0].map((r: any) => r.val).filter(Boolean);
}

// ─── Upload Batches ──────────────────────────────────────────────────

export async function createUploadBatch(data: InsertUploadBatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(uploadBatches).values(data);
}

export async function getUploadBatch(batchId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(uploadBatches).where(eq(uploadBatches.batchId, batchId)).limit(1);
  return result[0];
}

export async function updateUploadBatch(batchId: string, data: Partial<InsertUploadBatch>) {
  const db = await getDb();
  if (!db) return;
  await db.update(uploadBatches).set(data).where(eq(uploadBatches.batchId, batchId));
}

export async function getUploadBatches(page = 1, pageSize = 20) {
  const db = await getDb();
  if (!db) return { batches: [], total: 0 };
  const totalResult = await db.select({ count: count() }).from(uploadBatches);
  const total = totalResult[0]?.count ?? 0;
  const offset = (page - 1) * pageSize;
  const batches = await db.select().from(uploadBatches)
    .orderBy(desc(uploadBatches.createdAt))
    .limit(pageSize).offset(offset);
  return { batches, total };
}

// ─── Orders ──────────────────────────────────────────────────────────

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(orders).values(data);
  return result[0].insertId;
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set(data).where(eq(orders.id, id));
}

export async function getUserOrders(userId: number, page = 1, pageSize = 20) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const totalResult = await db.select({ count: count() }).from(orders).where(eq(orders.userId, userId));
  const total = totalResult[0]?.count ?? 0;
  const offset = (page - 1) * pageSize;
  const rows = await db.select().from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))
    .limit(pageSize).offset(offset);
  return { orders: rows, total };
}

export async function getAllOrders(page = 1, pageSize = 20) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const totalResult = await db.select({ count: count() }).from(orders);
  const total = totalResult[0]?.count ?? 0;
  const offset = (page - 1) * pageSize;
  const rows = await db.select().from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize).offset(offset);
  return { orders: rows, total };
}

// ─── Order Items ─────────────────────────────────────────────────────

export async function createOrderItems(items: InsertOrderItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (items.length === 0) return;
  await db.insert(orderItems).values(items);
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({
    id: orderItems.id,
    orderId: orderItems.orderId,
    categoryId: orderItems.categoryId,
    categoryName: categories.name,
    filters: orderItems.filters,
    leadCount: orderItems.leadCount,
    priceCents: orderItems.priceCents,
    downloadUrl: orderItems.downloadUrl,
    downloadKey: orderItems.downloadKey,
    createdAt: orderItems.createdAt,
  }).from(orderItems)
    .leftJoin(categories, eq(orderItems.categoryId, categories.id))
    .where(eq(orderItems.orderId, orderId));
  return rows;
}

// ─── Lead Pricing ────────────────────────────────────────────────────

export async function getPricingForCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadPricing)
    .where(and(eq(leadPricing.categoryId, categoryId), eq(leadPricing.isActive, true)))
    .orderBy(asc(leadPricing.minQuantity));
}

export async function calculatePrice(categoryId: number, quantity: number): Promise<number> {
  const tiers = await getPricingForCategory(categoryId);
  if (tiers.length === 0) return quantity * 150; // default R$1.50/lead
  // Find the matching tier
  for (const tier of tiers) {
    const max = tier.maxQuantity ?? Infinity;
    if (quantity >= tier.minQuantity && quantity <= max) {
      return quantity * tier.pricePerLeadCents;
    }
  }
  // Use the last tier if quantity exceeds all
  const lastTier = tiers[tiers.length - 1];
  return quantity * lastTier.pricePerLeadCents;
}

export async function upsertPricing(data: InsertLeadPricing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(leadPricing).values(data);
}

// ─── Analytics ───────────────────────────────────────────────────────

export async function getAnalytics() {
  const db = await getDb();
  if (!db) return { totalLeads: 0, totalOrders: 0, totalRevenue: 0, totalUsers: 0, categoryCounts: [] };

  // Run all queries in parallel
  const [totalLeadsResult, totalOrdersResult, revenueResult, totalUsersResult, categoryCounts] = await Promise.all([
    db.select({ count: count() }).from(leads).where(eq(leads.isActive, true)),
    db.select({ count: count() }).from(orders).where(eq(orders.status, "paid")),
    db.select({ total: sql<number>`COALESCE(SUM(totalCents), 0)` }).from(orders).where(eq(orders.status, "paid")),
    db.select({ count: count() }).from(users),
    db.select({ id: categories.id, name: categories.name, leadCount: categories.leadCount, color: categories.color })
      .from(categories).where(eq(categories.isActive, true)),
  ]);

  return {
    totalLeads: totalLeadsResult[0]?.count ?? 0,
    totalOrders: totalOrdersResult[0]?.count ?? 0,
    totalRevenue: revenueResult[0]?.total ?? 0,
    totalUsers: totalUsersResult[0]?.count ?? 0,
    categoryCounts,
  };
}

export async function getAdminUserStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, adminCount: 0, recentUsers: [] };
  // Run all queries in parallel
  const [totalResult, adminResult, recentUsers] = await Promise.all([
    db.select({ count: count() }).from(users),
    db.select({ count: count() }).from(users).where(eq(users.role, "admin")),
    db.select().from(users).orderBy(desc(users.createdAt)).limit(5),
  ]);
  return { totalUsers: totalResult[0]?.count ?? 0, adminCount: adminResult[0]?.count ?? 0, recentUsers };
}

export async function getRecentOrders(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    orderId: orders.id,
    userId: orders.userId,
    totalCents: orders.totalCents,
    status: orders.status,
    createdAt: orders.createdAt,
    userName: users.name,
    userEmail: users.email,
  }).from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

// ─── Favorites ───────────────────────────────────────────────────────────

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: favorites.id,
    categoryId: favorites.categoryId,
    categoryName: categories.name,
    categorySlug: categories.slug,
    categoryColor: categories.color,
    categoryIcon: categories.icon,
    categoryLeadCount: categories.leadCount,
    categoryDescription: categories.description,
    createdAt: favorites.createdAt,
  }).from(favorites)
    .leftJoin(categories, eq(favorites.categoryId, categories.id))
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt));
}

export async function toggleFavorite(userId: number, categoryId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.categoryId, categoryId)))
    .limit(1);
  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return false; // removed
  } else {
    await db.insert(favorites).values({ userId, categoryId });
    return true; // added
  }
}

export async function isFavorite(userId: number, categoryId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ count: count() }).from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.categoryId, categoryId)));
  return (result[0]?.count ?? 0) > 0;
}

// ─── Activity Log ───────────────────────────────────────────────────────

export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(activityLog).values(data);
  } catch (e) {
    console.error("[ActivityLog] Failed to log:", e);
  }
}

export async function getActivityLog(page = 1, pageSize = 50, actionFilter?: string) {
  const db = await getDb();
  if (!db) return { activities: [], total: 0 };
  const conditions = actionFilter ? eq(activityLog.action, actionFilter) : undefined;
  const totalResult = await db.select({ count: count() }).from(activityLog).where(conditions);
  const total = totalResult[0]?.count ?? 0;
  const offset = (page - 1) * pageSize;
  const activities = await db.select({
    id: activityLog.id,
    userId: activityLog.userId,
    action: activityLog.action,
    entityType: activityLog.entityType,
    entityId: activityLog.entityId,
    details: activityLog.details,
    createdAt: activityLog.createdAt,
    userName: users.name,
    userEmail: users.email,
  }).from(activityLog)
    .leftJoin(users, eq(activityLog.userId, users.id))
    .where(conditions)
    .orderBy(desc(activityLog.createdAt))
    .limit(pageSize).offset(offset);
  return { activities, total };
}

// ─── Export Leads (CSV) ─────────────────────────────────────────────────

export async function getLeadsForExport(orderItemId: number, orderId: number, userId: number) {
  const db = await getDb();
  if (!db) return { leads: [], fields: [] };
  
  // Verify order belongs to user and is paid
  const order = await db.select().from(orders).where(
    and(eq(orders.id, orderId), eq(orders.userId, userId), eq(orders.status, "paid"))
  ).limit(1);
  if (order.length === 0) return { leads: [], fields: [] };
  
  // Get order item
  const items = await db.select().from(orderItems).where(
    and(eq(orderItems.id, orderItemId), eq(orderItems.orderId, orderId))
  ).limit(1);
  if (items.length === 0) return { leads: [], fields: [] };
  const item = items[0];
  
  // Get category field definitions
  const cat = await db.select().from(categories).where(eq(categories.id, item.categoryId)).limit(1);
  const fieldDefs = (cat[0]?.fieldDefinitions as FieldDefinition[]) ?? [];
  
  // Get leads for this category with filters
  const conditions = [eq(leads.categoryId, item.categoryId), eq(leads.isActive, true)];
  const filters = (item.filters as Record<string, string>) ?? {};
  for (const [key, value] of Object.entries(filters)) {
    if (value && typeof value === "string" && value.trim()) {
      conditions.push(
        sql`JSON_UNQUOTE(JSON_EXTRACT(${leads.data}, ${`$.${key}`})) LIKE ${`%${value}%`}`
      );
    }
  }
  
  const rows = await db.select().from(leads)
    .where(and(...conditions))
    .orderBy(desc(leads.createdAt))
    .limit(item.leadCount);
  
  return { leads: rows, fields: fieldDefs };
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function updateUserOpenId(oldOpenId: string, newOpenId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ openId: newOpenId }).where(eq(users.openId, oldOpenId));
}
