import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  plan: mysqlEnum("plan", ["basic", "gold"]).default("basic").notNull(),
  generationsUsed: int("generationsUsed").default(0).notNull(),
  generationsLimit: int("generationsLimit").default(3).notNull(),
  avatarUrl: text("avatarUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  formType: mysqlEnum("formType", ["basic", "gold"]).default("basic").notNull(),
  fullName: varchar("fullName", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  headline: text("headline"),
  summary: text("summary"),
  currentRole: varchar("currentRole", { length: 255 }),
  currentCompany: varchar("currentCompany", { length: 255 }),
  yearsExperience: int("yearsExperience"),
  education: json("education"),
  experience: json("experience"),
  skills: json("skills"),
  certifications: json("certifications"),
  languages: json("languages"),
  targetRole: varchar("targetRole", { length: 255 }),
  targetIndustry: varchar("targetIndustry", { length: 255 }),
  salaryExpectation: varchar("salaryExpectation", { length: 100 }),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  portfolioUrl: varchar("portfolioUrl", { length: 500 }),
  audioTranscription: text("audioTranscription"),
  rawAudioUrl: text("rawAudioUrl"),
  optimizationScore: int("optimizationScore").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const generations = mysqlTable("generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  profileId: int("profileId").notNull(),
  type: mysqlEnum("type", ["cv_pdf", "linkedin_about", "linkedin_skills", "linkedin_hashtags", "full_optimization"]).notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  inputData: json("inputData"),
  outputData: json("outputData"),
  outputUrl: text("outputUrl"),
  tokensUsed: int("tokensUsed").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const ssiActions = mysqlTable("ssi_actions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["profile", "network", "engagement", "content"]).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  completed: boolean("completed").default(false).notNull(),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const messageTemplates = mysqlTable("message_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  targetRole: mysqlEnum("targetRole", ["recruiter", "manager", "director"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  industry: varchar("industry", { length: 100 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const planHistory = mysqlTable("plan_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fromPlan: mysqlEnum("fromPlan", ["basic", "gold"]).notNull(),
  toPlan: mysqlEnum("toPlan", ["basic", "gold"]).notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = typeof generations.$inferInsert;
export type SsiAction = typeof ssiActions.$inferSelect;
export type InsertSsiAction = typeof ssiActions.$inferInsert;
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;
