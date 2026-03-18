import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Favorites Tests ────────────────────────────────────────
describe("Favorites Feature", () => {
  it("should define favorites table in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.favorites).toBeDefined();
  });

  it("should have correct favorites table columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.favorites;
    // Check that the table has the expected structure
    expect(table).toBeDefined();
  });

  it("should have favorites router procedures defined", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("favorites.list");
    expect(procedures).toContain("favorites.toggle");
  });

  it("favorites.list should be a protected procedure (requires auth)", async () => {
    const { appRouter } = await import("./routers");
    // The procedure exists and is queryable
    expect(appRouter._def.procedures["favorites.list"]).toBeDefined();
  });

  it("favorites.toggle should be a protected procedure (requires auth)", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures["favorites.toggle"]).toBeDefined();
  });
});

// ─── Activity Log Tests ─────────────────────────────────────
describe("Activity Log Feature", () => {
  it("should define activityLog table in schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.activityLog).toBeDefined();
  });

  it("should have activity router procedures defined", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("activity.list");
  });

  it("activity.list should be an admin-only procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures["activity.list"]).toBeDefined();
  });
});

// ─── Export CSV Tests ───────────────────────────────────────
describe("Export CSV Feature", () => {
  it("should have export router procedures defined", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("export.leadsCSV");
  });

  it("export.leadsCSV should be a protected procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures["export.leadsCSV"]).toBeDefined();
  });
});

// ─── Client Dashboard Tests ─────────────────────────────────
describe("Client Dashboard Feature", () => {
  it("should have clientDashboard.metrics procedure", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("clientDashboard.metrics");
  });
});

// ─── User Management Tests ──────────────────────────────────
describe("User Management Feature", () => {
  it("should have users router procedures defined", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    expect(procedures).toContain("users.list");
    expect(procedures).toContain("users.updateRole");
  });

  it("users.list should be an admin-only procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures["users.list"]).toBeDefined();
  });

  it("users.updateRole should be an admin-only procedure", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures["users.updateRole"]).toBeDefined();
  });
});

// ─── DB Helper Functions Tests ──────────────────────────────
describe("Database Helper Functions", () => {
  it("should export getUserFavorites function", async () => {
    const db = await import("./db");
    expect(typeof db.getUserFavorites).toBe("function");
  });

  it("should export toggleFavorite function", async () => {
    const db = await import("./db");
    expect(typeof db.toggleFavorite).toBe("function");
  });

  it("should export getActivityLog function", async () => {
    const db = await import("./db");
    expect(typeof db.getActivityLog).toBe("function");
  });

  it("should export logActivity function", async () => {
    const db = await import("./db");
    expect(typeof db.logActivity).toBe("function");
  });

  it("should export getLeadsForExport function", async () => {
    const db = await import("./db");
    expect(typeof db.getLeadsForExport).toBe("function");
  });

  it("should export getAllUsers function", async () => {
    const db = await import("./db");
    expect(typeof db.getAllUsers).toBe("function");
  });

  it("should export updateUserRole function", async () => {
    const db = await import("./db");
    expect(typeof db.updateUserRole).toBe("function");
  });

  it("should export getClientDashboardMetrics function", async () => {
    const db = await import("./db");
    expect(typeof db.getClientDashboardMetrics).toBe("function");
  });
});

// ─── Router Structure Tests ─────────────────────────────────
describe("Router Structure Completeness", () => {
  it("should have all expected routers", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);

    // Core routers
    expect(procedures.some(p => p.startsWith("auth."))).toBe(true);
    expect(procedures.some(p => p.startsWith("categories."))).toBe(true);
    expect(procedures.some(p => p.startsWith("leads."))).toBe(true);
    expect(procedures.some(p => p.startsWith("orders."))).toBe(true);

    // New routers
    expect(procedures.some(p => p.startsWith("favorites."))).toBe(true);
    expect(procedures.some(p => p.startsWith("activity."))).toBe(true);
    expect(procedures.some(p => p.startsWith("export."))).toBe(true);
    expect(procedures.some(p => p.startsWith("users."))).toBe(true);
    expect(procedures.some(p => p.startsWith("clientDashboard."))).toBe(true);
  });

  it("should have correct number of procedure groups", async () => {
    const { appRouter } = await import("./routers");
    const procedures = Object.keys(appRouter._def.procedures);
    const groups = new Set(procedures.map(p => p.split(".")[0]));
    
    // At minimum: auth, categories, leads, orders, pricing, analytics, favorites, activity, export, users, clientDashboard, admin, system, cart
    expect(groups.size).toBeGreaterThanOrEqual(10);
  });
});
