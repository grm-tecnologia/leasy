import { eq, desc, and, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertProfile, profiles,
  InsertGeneration, generations,
  InsertSsiAction, ssiActions,
  InsertMessageTemplate, messageTemplates,
  planHistory,
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

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
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
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) { values.lastSignedIn = new Date(); }
    if (Object.keys(updateSet).length === 0) { updateSet.lastSignedIn = new Date(); }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserPlan(userId: number, plan: "basic" | "gold") {
  const db = await getDb();
  if (!db) return;
  const limit = plan === "gold" ? 999999 : 3;
  await db.update(users).set({ plan, generationsLimit: limit }).where(eq(users.id, userId));
}

export async function incrementGenerationsUsed(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ generationsUsed: sql`${users.generationsUsed} + 1` }).where(eq(users.id, userId));
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(desc(profiles.updatedAt)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertProfile(data: InsertProfile) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(profiles).where(eq(profiles.userId, data.userId)).limit(1);
  if (existing.length > 0) {
    await db.update(profiles).set({ ...data, updatedAt: new Date() }).where(eq(profiles.id, existing[0].id));
    return existing[0].id;
  } else {
    const result = await db.insert(profiles).values(data);
    return result[0].insertId;
  }
}

// ─── Generations ─────────────────────────────────────────────────────────────

export async function createGeneration(data: InsertGeneration) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(generations).values(data);
  return result[0].insertId;
}

export async function updateGeneration(id: number, data: Partial<InsertGeneration>) {
  const db = await getDb();
  if (!db) return;
  await db.update(generations).set(data).where(eq(generations.id, id));
}

export async function getGenerationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generations).where(eq(generations.userId, userId)).orderBy(desc(generations.createdAt));
}

export async function getGenerationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(generations).where(eq(generations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── SSI Actions ─────────────────────────────────────────────────────────────

export async function getSsiActionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ssiActions).where(eq(ssiActions.userId, userId)).orderBy(desc(ssiActions.createdAt));
}

export async function createSsiAction(data: InsertSsiAction) {
  const db = await getDb();
  if (!db) return;
  await db.insert(ssiActions).values(data);
}

export async function toggleSsiAction(id: number, completed: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(ssiActions).set({ completed }).where(eq(ssiActions.id, id));
}

export async function seedSsiActionsForUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(ssiActions).where(eq(ssiActions.userId, userId)).limit(1);
  if (existing.length > 0) return;
  const defaultActions: InsertSsiAction[] = [
    { userId, title: "Completar todas as secoes do perfil LinkedIn", category: "profile", priority: "high" },
    { userId, title: "Adicionar foto profissional de alta qualidade", category: "profile", priority: "high" },
    { userId, title: "Escrever um resumo otimizado com palavras-chave", category: "profile", priority: "high" },
    { userId, title: "Adicionar 50+ habilidades relevantes", category: "profile", priority: "medium" },
    { userId, title: "Conectar com 20 profissionais da sua area", category: "network", priority: "high" },
    { userId, title: "Enviar mensagens personalizadas para 5 recrutadores", category: "network", priority: "medium" },
    { userId, title: "Participar de 3 grupos relevantes da sua area", category: "network", priority: "medium" },
    { userId, title: "Publicar 1 post por semana sobre sua area", category: "content", priority: "high" },
    { userId, title: "Compartilhar artigos relevantes com comentario proprio", category: "content", priority: "medium" },
    { userId, title: "Curtir e comentar em 5 posts por dia", category: "engagement", priority: "medium" },
    { userId, title: "Responder a todos os comentarios nos seus posts", category: "engagement", priority: "low" },
    { userId, title: "Verificar e melhorar seu SSI Score semanalmente", category: "engagement", priority: "high" },
  ];
  await db.insert(ssiActions).values(defaultActions);
}

// ─── Message Templates ───────────────────────────────────────────────────────

export async function getMessageTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messageTemplates)
    .where(sql`${messageTemplates.userId} = ${userId} OR ${messageTemplates.isDefault} = true`)
    .orderBy(desc(messageTemplates.createdAt));
}

export async function createMessageTemplate(data: InsertMessageTemplate) {
  const db = await getDb();
  if (!db) return;
  await db.insert(messageTemplates).values(data);
}

export async function incrementTemplateUsage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(messageTemplates).set({ usageCount: sql`${messageTemplates.usageCount} + 1` }).where(eq(messageTemplates.id, id));
}

export async function seedDefaultTemplates() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(messageTemplates).where(eq(messageTemplates.isDefault, true)).limit(1);
  if (existing.length > 0) return;
  const defaults: InsertMessageTemplate[] = [
    { targetRole: "recruiter", title: "Abordagem inicial para Recrutador", content: "Ola [Nome], tudo bem? Vi que voce atua como recrutador(a) na area de [Area]. Estou em busca de novas oportunidades como [Cargo Desejado] e acredito que meu perfil pode ser relevante para as vagas que voce trabalha. Tenho [X] anos de experiencia em [Habilidades Principais]. Posso enviar meu curriculo atualizado? Obrigado(a)!", isDefault: true },
    { targetRole: "recruiter", title: "Follow-up para Recrutador", content: "Ola [Nome], espero que esteja bem! Estou retomando nosso contato pois continuo interessado(a) em oportunidades na area de [Area]. Desde nosso ultimo contato, [mencione algo novo: certificacao, projeto, etc]. Caso surja alguma vaga alinhada ao meu perfil, ficarei muito grato(a) pela indicacao. Abracos!", isDefault: true },
    { targetRole: "manager", title: "Abordagem para Gestor de Area", content: "Ola [Nome], tudo bem? Acompanho o trabalho da [Empresa] e admiro muito a atuacao na area de [Area]. Sou [Cargo Atual] com [X] anos de experiencia em [Habilidades]. Gostaria de saber se ha oportunidades abertas no seu time ou se poderiamos conversar sobre como posso contribuir. Agradeco a atencao!", isDefault: true },
    { targetRole: "manager", title: "Networking com Gestor", content: "Ola [Nome]! Vi seu post sobre [Tema] e achei muito relevante. Trabalho com [Area] ha [X] anos e tenho interesse em trocar experiencias. Seria possivel uma conversa rapida de 15 minutos? Acredito que podemos compartilhar insights valiosos. Obrigado(a)!", isDefault: true },
    { targetRole: "director", title: "Abordagem para Diretor/VP", content: "Prezado(a) [Nome], acompanho com admiracao a trajetoria da [Empresa] sob sua lideranca na area de [Area]. Sou um(a) profissional com [X] anos de experiencia em [Especializacao] e tenho contribuido com resultados como [Resultado Concreto]. Gostaria de explorar como posso agregar valor ao seu time. Teria disponibilidade para uma breve conversa?", isDefault: true },
    { targetRole: "director", title: "Proposta de Valor para Diretor", content: "Prezado(a) [Nome], permita-me apresentar brevemente: sou [Nome] e atuo como [Cargo] com foco em [Area]. Nos ultimos [X] anos, alcancei resultados como [Resultado 1] e [Resultado 2]. Acredito que minha experiencia pode contribuir significativamente para os objetivos da [Empresa]. Poderiamos agendar uma conversa de 15 minutos?", isDefault: true },
  ];
  await db.insert(messageTemplates).values(defaults);
}

// ─── Admin Stats ─────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, goldUsers: 0, totalGenerations: 0, totalProfiles: 0 };
  const [userCount] = await db.select({ count: count() }).from(users);
  const [goldCount] = await db.select({ count: count() }).from(users).where(eq(users.plan, "gold"));
  const [genCount] = await db.select({ count: count() }).from(generations);
  const [profCount] = await db.select({ count: count() }).from(profiles);
  return {
    totalUsers: userCount.count,
    goldUsers: goldCount.count,
    totalGenerations: genCount.count,
    totalProfiles: profCount.count,
  };
}

export async function getRecentGenerations(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(generations).orderBy(desc(generations.createdAt)).limit(limit);
}
