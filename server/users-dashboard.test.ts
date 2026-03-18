import { describe, it, expect } from "vitest";

// Test the user management and client dashboard router shapes
// These tests validate the procedure definitions exist and are properly structured

describe("User Management & Client Dashboard Procedures", () => {
  it("should export routers module with expected shape", async () => {
    const routers = await import("./routers");
    expect(routers).toBeDefined();
    expect(routers.appRouter).toBeDefined();
  });

  it("should have users router with list and updateRole procedures", async () => {
    const routers = await import("./routers");
    const router = routers.appRouter;
    const procedures = Object.keys(router._def.procedures);
    expect(procedures).toContain("users.list");
    expect(procedures).toContain("users.updateRole");
  });

  it("should have clientDashboard router with metrics procedure", async () => {
    const routers = await import("./routers");
    const router = routers.appRouter;
    const procedures = Object.keys(router._def.procedures);
    expect(procedures).toContain("clientDashboard.metrics");
  });

  it("should have analytics procedures", async () => {
    const routers = await import("./routers");
    const router = routers.appRouter;
    const procedures = Object.keys(router._def.procedures);
    expect(procedures).toContain("analytics.overview");
    expect(procedures).toContain("analytics.recentOrders");
  });

  it("should have all order procedures", async () => {
    const routers = await import("./routers");
    const router = routers.appRouter;
    const procedures = Object.keys(router._def.procedures);
    expect(procedures).toContain("orders.myOrders");
    expect(procedures).toContain("orders.getOrder");
    expect(procedures).toContain("orders.adminList");
  });

  it("should have category and lead procedures", async () => {
    const routers = await import("./routers");
    const router = routers.appRouter;
    const procedures = Object.keys(router._def.procedures);
    expect(procedures).toContain("categories.list");
    expect(procedures).toContain("leads.browse");
    expect(procedures).toContain("leads.search");
    expect(procedures).toContain("leads.adminList");
  });
});

describe("Database helpers", () => {
  it("should export all required db helper functions", async () => {
    const db = await import("./db");
    expect(typeof db.getAllUsers).toBe("function");
    expect(typeof db.updateUserRole).toBe("function");
    expect(typeof db.getClientDashboardMetrics).toBe("function");
    expect(typeof db.getAllCategories).toBe("function");
    expect(typeof db.getAnalytics).toBe("function");
  });
});
