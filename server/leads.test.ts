import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@leadhub.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@test.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("categories", () => {
  it("should list active categories publicly", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const categories = await caller.categories.list();
    expect(Array.isArray(categories)).toBe(true);
  });

  it("should list all categories for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const categories = await caller.categories.listAll();
    expect(Array.isArray(categories)).toBe(true);
  });

  it("should deny listAll for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.categories.listAll()).rejects.toThrow();
  });

  it("should get category by slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const cat = await caller.categories.getBySlug({ slug: "ugc-creators-marcas" });
    // May or may not exist depending on seed data
    if (cat) {
      expect(cat.slug).toBe("ugc-creators-marcas");
    }
  });
});

describe("leads", () => {
  it("should browse leads publicly with filters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.leads.browse({
      categoryId: 1,
      filters: {},
      page: 1,
      pageSize: 10,
    });
    expect(result).toHaveProperty("leads");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.leads)).toBe(true);
  });

  it("should count leads for a category", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const count = await caller.leads.count({ categoryId: 1 });
    expect(typeof count).toBe("number");
  });

  it("should deny lead removal for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.leads.remove({ id: 1 })).rejects.toThrow();
  });
});

describe("pricing", () => {
  it("should get pricing for a category", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const pricing = await caller.pricing.getForCategory({ categoryId: 1 });
    expect(Array.isArray(pricing)).toBe(true);
  });

  it("should calculate price for a quantity", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.pricing.calculate({ categoryId: 1, quantity: 50 });
    expect(result).toHaveProperty("totalCents");
    expect(result).toHaveProperty("pricePerLeadCents");
    expect(typeof result.totalCents).toBe("number");
  });
});

describe("auth", () => {
  it("should return null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });

  it("should return user for authenticated user", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const me = await caller.auth.me();
    expect(me).toBeDefined();
    expect(me?.name).toBe("Test User");
  });
});

describe("analytics", () => {
  it("should deny analytics for regular users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.analytics.overview()).rejects.toThrow();
  });

  it("should return analytics for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const analytics = await caller.analytics.overview();
    expect(analytics).toBeDefined();
  });
});
