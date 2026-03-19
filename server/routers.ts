import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, adminProcedure, ownerProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import {
  getAllCategories, getCategoryById, getCategoryBySlug, createCategory, updateCategory, updateCategoryLeadCount,
  insertLeads, getLeadsForCategory, getLeadsByIds, countLeadsForFilter, getDistinctValues, deleteLead,
  createUploadBatch, getUploadBatch, updateUploadBatch, getUploadBatches,
  createOrder, getOrderById, updateOrder, getUserOrders, getAllOrders,
  createOrderItems, getOrderItems,
  getPricingForCategory, calculatePrice, upsertPricing,
  getAnalytics, getRecentOrders,
  getAllUsers, updateUserRole, getUserById, getAdminUserStats,
  getClientDashboardMetrics,
  getUserFavorites, toggleFavorite,
  logActivity, getActivityLog,
  getLeadsForExport,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import type { FieldDefinition } from "../drizzle/schema";
import { createPreference, getPayment } from "./mercadopago";
import { processOrderPayment } from "./webhooks";
import { sanitizeObject, sanitizeSearchQuery, validateUploadFile, validateRowCount } from "./security";
import { sendOrderConfirmationEmail } from "./email";

// ─── Routers ─────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const adminEmail = process.env.ADMIN_EMAIL ?? "";
      const result = {
        ...opts.ctx.user,
        isOwner: !!(adminEmail && opts.ctx.user.email === adminEmail),
      };
      // Debug log removed for production
      return result;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, cookieOptions);
      return { success: true } as const;
    }),
  }),

  // ─── Categories ──────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories(true);
    }),

    listAll: adminProcedure.query(async () => {
      return getAllCategories(false);
    }),

    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getCategoryById(input.id);
    }),

    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      return getCategoryBySlug(input.slug);
    }),

    create: adminProcedure.input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      fieldDefinitions: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "number", "date", "email", "phone", "cpf", "cnpj", "url", "boolean"]),
        filterable: z.boolean(),
        isContact: z.boolean(),
      })).optional(),
    })).mutation(async ({ input }) => {
      const id = await createCategory({
        ...input,
        fieldDefinitions: input.fieldDefinitions ?? [],
      });
      return { id };
    }),

    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      isActive: z.boolean().optional(),
      fieldDefinitions: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "number", "date", "email", "phone", "cpf", "cnpj", "url", "boolean"]),
        filterable: z.boolean(),
        isContact: z.boolean(),
      })).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCategory(id, data as any);
      return { success: true };
    }),

    getFilterOptions: publicProcedure.input(z.object({
      categoryId: z.number(),
      fieldName: z.string(),
    })).query(async ({ input }) => {
      return getDistinctValues(input.categoryId, input.fieldName);
    }),
  }),

  // ─── Leads ───────────────────────────────────────────────────────
  leads: router({
    browse: publicProcedure.input(z.object({
      categoryId: z.number(),
      filters: z.record(z.string(), z.string()).optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    })).query(async ({ input }) => {
      return getLeadsForCategory(input.categoryId, input.filters ?? {}, input.page, input.pageSize);
    }),

    count: publicProcedure.input(z.object({
      categoryId: z.number(),
      filters: z.record(z.string(), z.string()).optional(),
    })).query(async ({ input }) => {
      return countLeadsForFilter(input.categoryId, input.filters ?? {});
    }),

    remove: adminProcedure.input(z.object({
      leadId: z.number(),
    })).mutation(async ({ input }) => {
      await deleteLead(input.leadId);
      return { success: true };
    }),

    // Admin: get all leads with full data
    adminList: adminProcedure.input(z.object({
      categoryId: z.number().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    })).query(async ({ input }) => {
      if (!input.categoryId) return { leads: [], total: 0 };
      return getLeadsForCategory(input.categoryId, {}, input.page, input.pageSize);
    }),

    // Global search across all categories
    search: publicProcedure.input(z.object({
      query: z.string().min(1),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(20),
    })).query(async ({ input }) => {
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) return { leads: [], total: 0 };
      const { leads: leadsTable, categories: catsTable } = await import("../drizzle/schema");
      const { sql, eq, and, count: countFn, desc } = await import("drizzle-orm");
      const sanitizedQuery = sanitizeSearchQuery(input.query);
      if (!sanitizedQuery) return { leads: [], total: 0 };
      const q = `%${sanitizedQuery}%`;
      const whereClause = and(
        eq(leadsTable.isActive, true),
        sql`CAST(${leadsTable.data} AS CHAR) LIKE ${q}`
      );
      const totalResult = await db.select({ count: countFn() }).from(leadsTable).where(whereClause);
      const total = totalResult[0]?.count ?? 0;
      const offset = (input.page - 1) * input.pageSize;
      const rows = await db.select({
        id: leadsTable.id,
        categoryId: leadsTable.categoryId,
        data: leadsTable.data,
        createdAt: leadsTable.createdAt,
        categoryName: catsTable.name,
        categorySlug: catsTable.slug,
        categoryColor: catsTable.color,
        categoryIcon: catsTable.icon,
      }).from(leadsTable)
        .leftJoin(catsTable, eq(leadsTable.categoryId, catsTable.id))
        .where(whereClause)
        .orderBy(desc(leadsTable.createdAt))
        .limit(input.pageSize)
        .offset(offset);
      return { leads: rows, total };
    }),
  }),

  // ─── Upload / Ingestion ──────────────────────────────────────────
  upload: router({
    // Step 1: Upload file to S3 and create batch record
    initBatch: adminProcedure.input(z.object({
      categoryId: z.number(),
      fileName: z.string(),
      fileContent: z.string(), // base64 encoded
    })).mutation(async ({ ctx, input }) => {
      const batchId = nanoid(16);
      const fileBuffer = Buffer.from(input.fileContent, "base64");

      // Validate file size and type
      const fileValidation = validateUploadFile(input.fileName, fileBuffer.length);
      if (!fileValidation.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: fileValidation.error });
      }

      const ext = input.fileName.split(".").pop() || "csv";
      const fileKey = `uploads/${batchId}.${ext}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, fileBuffer, "application/octet-stream");

      // Create batch record
      await createUploadBatch({
        batchId,
        categoryId: input.categoryId,
        fileName: input.fileName,
        fileUrl: url,
        status: "pending",
        uploadedBy: ctx.user.id,
      });

      return { batchId, fileUrl: url };
    }),

    // Step 2: Analyze file with AI to map columns
    analyzeColumns: adminProcedure.input(z.object({
      batchId: z.string(),
      sampleRows: z.array(z.record(z.string(), z.string())),
      originalColumns: z.array(z.string()),
    })).mutation(async ({ input }) => {
      const batch = await getUploadBatch(input.batchId);
      if (!batch) throw new TRPCError({ code: "NOT_FOUND", message: "Batch não encontrado" });

      const category = await getCategoryById(batch.categoryId);
      if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada" });

      const existingFields = (category.fieldDefinitions as FieldDefinition[]) || [];

      // Heuristic-based mapping as primary + LLM as enhancement
      const heuristicMapping: Record<string, string | null> = {};
      const heuristicAliases: Record<string, string[]> = {
        nome: ["nome", "name", "nome_completo", "nome completo", "full_name", "fullname", "razao_social", "razão social", "razao social", "responsavel", "responsável", "nome da agência", "nome da agencia"],
        email: ["email", "e-mail", "e_mail", "mail", "correio", "email_contato", "contato_email"],
        telefone: ["telefone", "phone", "tel", "celular", "fone", "whatsapp", "wpp", "mobile", "contato", "tel_contato", "numero"],
        cidade: ["cidade", "city", "municipio", "município", "localidade"],
        estado: ["estado", "state", "uf", "sigla_uf"],
        cpf: ["cpf", "cpf_cnpj", "documento"],
        cnpj: ["cnpj"],
        bairro: ["bairro", "neighborhood", "district"],
        endereco: ["endereco", "endereço", "address", "rua", "logradouro"],
        cep: ["cep", "zip", "zipcode", "codigo_postal"],
        instagram: ["instagram", "insta", "ig", "perfil_instagram", "arroba"],
        website: ["website", "site", "url", "link", "pagina"],
        segmento: ["segmento", "setor", "segment", "area", "área", "ramo", "nicho", "especialidade"],
        empresa: ["empresa", "company", "companhia", "organizacao", "organização"],
        cargo: ["cargo", "position", "funcao", "função", "role", "titulo"],
        renda: ["renda", "income", "salario", "salário", "faturamento", "receita"],
        idade: ["idade", "age", "faixa_etaria", "faixa etária"],
      };

      // Try heuristic matching first
      for (const col of input.originalColumns) {
        const colLower = col.toLowerCase().trim().replace(/[_\-\.]/g, " ");
        let matched = false;
        for (const field of existingFields) {
          const fieldLower = field.name.toLowerCase();
          const fieldLabelLower = field.label.toLowerCase();
          // Direct match
          if (colLower === fieldLower || colLower === fieldLabelLower) {
            heuristicMapping[col] = field.name;
            matched = true;
            break;
          }
          // Alias match
          const aliases = heuristicAliases[fieldLower] || [];
          if (aliases.some(a => colLower === a || colLower.includes(a) || a.includes(colLower))) {
            heuristicMapping[col] = field.name;
            matched = true;
            break;
          }
        }
        if (!matched) {
          // Check global aliases to suggest field type
          for (const [key, aliases] of Object.entries(heuristicAliases)) {
            if (aliases.some(a => colLower === a || colLower.includes(a))) {
              // Check if this key matches any existing field
              const existingMatch = existingFields.find(f => f.name.toLowerCase() === key);
              if (existingMatch) {
                heuristicMapping[col] = existingMatch.name;
                matched = true;
              }
              break;
            }
          }
        }
        if (!matched) {
          heuristicMapping[col] = null;
        }
      }

      // Use LLM to enhance: handle unmapped columns and suggest new fields
      const unmappedCols = input.originalColumns.filter(c => !heuristicMapping[c]);
      let llmNewFields: Array<{ name: string; label: string; type: string; filterable: boolean; isContact: boolean }> = [];
      let llmMapping: Record<string, string | null> = {};

      try {
        const existingFieldsList = existingFields.map(f => `${f.name} (${f.label}, tipo: ${f.type})`).join(", ");
        const prompt = `Analise estas colunas de um arquivo de leads da categoria "${category.name}".

Campos já existentes: ${existingFieldsList}

Colunas do arquivo: ${input.originalColumns.join(", ")}
Colunas já mapeadas: ${Object.entries(heuristicMapping).filter(([,v]) => v).map(([k,v]) => `${k} -> ${v}`).join(", ")}
Colunas NÃO mapeadas: ${unmappedCols.join(", ")}

Amostra de dados:
${JSON.stringify(input.sampleRows.slice(0, 3))}

Responda com JSON puro (sem markdown, sem \`\`\`):
{"mapping": {"coluna_original": "campo_existente_ou_null"}, "newFields": [{"name": "snake_case", "label": "Em Português", "type": "text", "filterable": true, "isContact": false}]}

Regras:
- Em "mapping", inclua APENAS as colunas não mapeadas (${unmappedCols.join(", ")})
- Para cada coluna não mapeada, tente mapear para um campo existente. Se não for possível, coloque null
- Em "newFields", sugira campos novos para colunas que ficaram null. Use snake_case para name
- type pode ser: text, number, date, email, phone, cpf, cnpj, url, boolean
- isContact=true para dados sensíveis (email, telefone, cpf, cnpj)
- filterable=true se faz sentido filtrar por esse campo`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "Responda APENAS com JSON válido. Sem markdown, sem explicações, sem ```json." },
            { role: "user", content: prompt },
          ],
        });

        const rawContent = response.choices[0]?.message?.content;
        if (rawContent) {
          const contentStr = typeof rawContent === "string" ? rawContent : (rawContent[0] as any)?.text ?? "";
          // Clean potential markdown wrapping
          const cleaned = contentStr.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.mapping && typeof parsed.mapping === "object") {
            llmMapping = parsed.mapping;
          }
          if (Array.isArray(parsed.newFields)) {
            llmNewFields = parsed.newFields.filter((f: any) =>
              f && typeof f.name === "string" && typeof f.label === "string" && typeof f.type === "string"
            ).map((f: any) => ({
              name: f.name,
              label: f.label,
              type: f.type || "text",
              filterable: f.filterable !== false,
              isContact: f.isContact === true,
            }));
          }
        }
      } catch (llmErr) {
        console.warn("[LLM] Falha no mapeamento por IA, usando apenas heurística:", llmErr);
        // Fallback: create new text fields for all unmapped columns
        llmNewFields = unmappedCols.map(col => {
          const snakeName = col.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
          return {
            name: snakeName,
            label: col,
            type: "text" as const,
            filterable: true,
            isContact: false,
          };
        });
      }

      // Merge heuristic + LLM mappings
      const finalMapping: Record<string, string | null> = { ...heuristicMapping };
      for (const [col, field] of Object.entries(llmMapping)) {
        if (field && !finalMapping[col]) {
          finalMapping[col] = field;
        }
      }

      // For still-unmapped columns, map to new fields if available
      for (const col of input.originalColumns) {
        if (!finalMapping[col]) {
          const newField = llmNewFields.find(f => {
            const colLower = col.toLowerCase().replace(/[^a-z0-9]+/g, " ");
            return f.name === col.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
              || f.label.toLowerCase() === col.toLowerCase()
              || colLower.includes(f.name.replace(/_/g, " "));
          });
          if (newField) {
            finalMapping[col] = newField.name;
          }
        }
      }

      const result = { mapping: finalMapping, newFields: llmNewFields };

      // Filter out null values for storage (keep only mapped columns)
      const cleanMapping: Record<string, string> = {};
      for (const [k, v] of Object.entries(result.mapping)) {
        if (v) cleanMapping[k] = v;
      }

      // Update batch with mapping
      await updateUploadBatch(input.batchId, {
        columnMapping: cleanMapping,
        suggestedFields: result.newFields as FieldDefinition[],
        status: "mapping",
      });

      return result;
    }),

    // Step 3: Confirm mapping and process leads
    processLeads: adminProcedure.input(z.object({
      batchId: z.string(),
      mapping: z.record(z.string(), z.string()),
      newFields: z.array(z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "number", "date", "email", "phone", "cpf", "cnpj", "url", "boolean"]),
        filterable: z.boolean(),
        isContact: z.boolean(),
      })).optional(),
      rows: z.array(z.record(z.string(), z.string())),
    })).mutation(async ({ input }) => {
      const batch = await getUploadBatch(input.batchId);
      if (!batch) throw new TRPCError({ code: "NOT_FOUND", message: "Batch não encontrado" });

      const category = await getCategoryById(batch.categoryId);
      if (!category) throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada" });

      // If there are new fields, add them to the category
      if (input.newFields && input.newFields.length > 0) {
        const existingFields = (category.fieldDefinitions as FieldDefinition[]) || [];
        const existingNames = new Set(existingFields.map(f => f.name));
        const fieldsToAdd = input.newFields.filter(f => !existingNames.has(f.name));
        if (fieldsToAdd.length > 0) {
          await updateCategory(batch.categoryId, {
            fieldDefinitions: [...existingFields, ...fieldsToAdd],
          });
        }
      }

      // Build field type map for validation
      const allFields = [
        ...((category.fieldDefinitions as FieldDefinition[]) || []),
        ...(input.newFields || []),
      ];
      const fieldTypeMap = new Map(allFields.map(f => [f.name, f.type]));

      // Validation helpers
      const validateCpf = (cpf: string): boolean => {
        const cleaned = cpf.replace(/\D/g, "");
        if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
        let rest = 11 - (sum % 11);
        if (rest >= 10) rest = 0;
        if (rest !== parseInt(cleaned[9])) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
        rest = 11 - (sum % 11);
        if (rest >= 10) rest = 0;
        return rest === parseInt(cleaned[10]);
      };
      const validateEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      const validatePhone = (phone: string): boolean => {
        const cleaned = phone.replace(/\D/g, "");
        return cleaned.length >= 10 && cleaned.length <= 13;
      };
      const formatPhone = (phone: string): string => {
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length === 11) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
        if (cleaned.length === 10) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
        return phone;
      };
      const formatCpf = (cpf: string): string => {
        const cleaned = cpf.replace(/\D/g, "");
        if (cleaned.length === 11) return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`;
        return cpf;
      };

      // Transform rows using the mapping with validation
      const leadsData = input.rows.map(row => {
        const data: Record<string, unknown> = {};
        for (const [originalCol, targetField] of Object.entries(input.mapping)) {
          if (targetField && row[originalCol] !== undefined && row[originalCol] !== null && row[originalCol] !== "") {
            let value: string = row[originalCol].trim();
            const fieldType = fieldTypeMap.get(targetField);
            // Validate and format based on type
            if (fieldType === "cpf") {
              if (validateCpf(value)) value = formatCpf(value);
              else continue; // skip invalid CPF
            } else if (fieldType === "email") {
              if (!validateEmail(value)) continue; // skip invalid email
              value = value.toLowerCase().trim();
            } else if (fieldType === "phone") {
              if (!validatePhone(value)) continue; // skip invalid phone
              value = formatPhone(value);
            }
            data[targetField] = value;
          }
        }
        // Sanitize all data values
        const sanitizedData = sanitizeObject(data);
        return {
          categoryId: batch.categoryId,
          data: sanitizedData,
          batchId: input.batchId,
        };
      }).filter(l => Object.keys(l.data).length > 0);

      // Validate row count
      const rowValidation = validateRowCount(input.rows.length);
      if (!rowValidation.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: rowValidation.error });
      }

      // Insert leads in batches
      await insertLeads(leadsData);

      // Update batch status
      await updateUploadBatch(input.batchId, {
        status: "completed",
        totalRows: input.rows.length,
        processedRows: leadsData.length,
      });

      // Update category lead count
      await updateCategoryLeadCount(batch.categoryId);

      return { processed: leadsData.length, total: input.rows.length };
    }),

    // Get batch list
    listBatches: adminProcedure.input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    })).query(async ({ input }) => {
      return getUploadBatches(input.page, input.pageSize);
    }),

    getBatch: adminProcedure.input(z.object({ batchId: z.string() })).query(async ({ input }) => {
      return getUploadBatch(input.batchId);
    }),
  }),

  // ─── Pricing ─────────────────────────────────────────────────────
  pricing: router({
    getForCategory: publicProcedure.input(z.object({ categoryId: z.number() })).query(async ({ input }) => {
      return getPricingForCategory(input.categoryId);
    }),

    calculate: publicProcedure.input(z.object({
      categoryId: z.number(),
      quantity: z.number().min(1),
    })).query(async ({ input }) => {
      const totalCents = await calculatePrice(input.categoryId, input.quantity);
      return { totalCents, pricePerLeadCents: Math.round(totalCents / input.quantity) };
    }),

    update: adminProcedure.input(z.object({
      categoryId: z.number(),
      tiers: z.array(z.object({
        minQuantity: z.number().min(1),
        maxQuantity: z.number().nullable(),
        pricePerLeadCents: z.number().min(1),
      })),
    })).mutation(async ({ input }) => {
      // For simplicity, we'll delete existing and re-insert
      const { getDb } = await import("./db");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { leadPricing } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await db.delete(leadPricing).where(eq(leadPricing.categoryId, input.categoryId));
      for (const tier of input.tiers) {
        await upsertPricing({
          categoryId: input.categoryId,
          ...tier,
        });
      }
      return { success: true };
    }),
  }),

  // ─── Orders ──────────────────────────────────────────────────────
  orders: router({
    create: protectedProcedure.input(z.object({
      items: z.array(z.object({
        categoryId: z.number(),
        filters: z.record(z.string(), z.string()).optional(),
        leadCount: z.number().min(1),
      })),
    })).mutation(async ({ ctx, input }) => {
      // Validate lead availability before creating order
      for (const item of input.items) {
        const available = await countLeadsForFilter(item.categoryId, item.filters ?? {});
        if (available === 0) {
          const cat = await getCategoryById(item.categoryId);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Não há leads disponíveis na categoria "${cat?.name ?? "desconhecida"}". Aguarde novos leads serem adicionados.`,
          });
        }
        if (item.leadCount > available) {
          const cat = await getCategoryById(item.categoryId);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Quantidade solicitada (${item.leadCount}) excede os leads disponíveis (${available}) na categoria "${cat?.name ?? "desconhecida"}".`,
          });
        }
      }
      // Calculate total price
      let totalCents = 0;
      const itemsWithPrice = [];
      for (const item of input.items) {
        const priceCents = await calculatePrice(item.categoryId, item.leadCount);
        totalCents += priceCents;
        itemsWithPrice.push({ ...item, priceCents });
      }

      // Create order
      const orderId = await createOrder({
        userId: ctx.user.id,
        totalCents,
        status: "pending",
      });

      // Create order items
      await createOrderItems(
        itemsWithPrice.map(item => ({
          orderId,
          categoryId: item.categoryId,
          filters: item.filters ?? {},
          leadCount: item.leadCount,
          priceCents: item.priceCents,
        }))
      );

      // Create Mercado Pago preference
      let paymentUrl = "";
      try {
        const preference = await createPreference({
          items: await Promise.all(itemsWithPrice.map(async (item) => {
            const cat = await getCategoryById(item.categoryId);
            return {
              title: `Leads ${cat?.name ?? ""} (${item.leadCount} contatos)`,
              quantity: 1,
              unit_price: item.priceCents / 100,
            };
          })),
          externalReference: String(orderId),
          backUrls: {
            success: `${ctx.req.headers.origin || "https://leasy.app.br"}/orders/${orderId}`,
            failure: `${ctx.req.headers.origin || "https://leasy.app.br"}/orders/${orderId}`,
            pending: `${ctx.req.headers.origin || "https://leasy.app.br"}/orders/${orderId}`,
          },
          notificationUrl: `${ctx.req.headers.origin || "https://leasy.app.br"}/api/webhooks/mercadopago`,
        });
        paymentUrl = preference.init_point || preference.sandbox_init_point;
        await updateOrder(orderId, { paymentUrl, paymentId: preference.id });
      } catch (e) {
        console.error("[MercadoPago] Failed to create preference:", e);
      }

      // Send order confirmation email (fire-and-forget)
      try {
        if (ctx.user.email) {
          const emailItems = [];
          for (const item of itemsWithPrice) {
            const cat = await getCategoryById(item.categoryId);
            emailItems.push({
              categoryName: cat?.name ?? "Leads",
              leadCount: item.leadCount,
              priceCents: item.priceCents,
            });
          }
          sendOrderConfirmationEmail(
            ctx.user.email,
            ctx.user.name ?? "",
            orderId,
            totalCents,
            emailItems
          ).catch(err => console.warn("[Email] Failed to send order confirmation:", err));
        }
      } catch (err) {
        console.warn("[Email] Error preparing order confirmation:", err);
      }

      return { orderId, totalCents, paymentUrl };
    }),

    // Mark order as paid (called after payment confirmation or via webhook)
    confirmPayment: protectedProcedure.input(z.object({
      orderId: z.number(),
      paymentId: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Use shared payment processing logic
      const success = await processOrderPayment(input.orderId, input.paymentId);
      return { success };
    }),

    // Check payment status from Mercado Pago
    checkPaymentStatus: protectedProcedure.input(z.object({
      orderId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (order.status === "paid") return { status: "paid" as const };
      if (!order.paymentId) return { status: order.status as string };

      try {
        const payment = await getPayment(order.paymentId);
        if (payment.status === "approved") {
          await processOrderPayment(input.orderId, order.paymentId, payment);
          return { status: "paid" as const };
        }
        return { status: payment.status as string };
      } catch {
        return { status: order.status as string };
      }
    }),

    myOrders: protectedProcedure.input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(50).default(10),
    })).query(async ({ ctx, input }) => {
      return getUserOrders(ctx.user.id, input.page, input.pageSize);
    }),

    getOrder: protectedProcedure.input(z.object({ orderId: z.number() })).query(async ({ ctx, input }) => {
      const order = await getOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND" });
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const items = await getOrderItems(input.orderId);
      return { order, items };
    }),

    // Admin: list all orders
    adminList: adminProcedure.input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
    })).query(async ({ input }) => {
      return getAllOrders(input.page, input.pageSize);
    }),
  }),

  // ─── Analytics ───────────────────────────────────────────────────
  analytics: router({
    overview: adminProcedure.query(async () => {
      return getAnalytics();
    }),

    recentOrders: adminProcedure.input(z.object({
      limit: z.number().min(1).max(50).default(10),
    })).query(async ({ input }) => {
      return getRecentOrders(input.limit);
    }),
  }),

  // ─── User Management (Admin) ─────────────────────────────────────
  users: router({
    list: adminProcedure.input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      search: z.string().optional(),
    })).query(async ({ input }) => {
      return getAllUsers(input.page, input.pageSize, input.search);
    }),

    getById: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getUserById(input.id);
    }),

    updateRole: ownerProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ ctx, input }) => {
      // Prevent self-demotion
      if (input.userId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Você não pode alterar seu próprio papel." });
      }
      await updateUserRole(input.userId, input.role);
      console.log(`[Permissions] User ${ctx.user.email} changed user #${input.userId} role to ${input.role}`);
      return { success: true };
    }),

    stats: adminProcedure.query(async () => {
      return getAdminUserStats();
    }),
  }),

  // ─── Client Dashboard ──────────────────────────────────────────
  clientDashboard: router({
    metrics: protectedProcedure.query(async ({ ctx }) => {
      return getClientDashboardMetrics(ctx.user.id);
    }),
  }),

  // ─── Favorites ──────────────────────────────────────────────────
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserFavorites(ctx.user.id);
    }),

    toggle: protectedProcedure.input(z.object({
      categoryId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const added = await toggleFavorite(ctx.user.id, input.categoryId);
      return { added };
    }),
  }),

  // ─── Activity Log (Admin) ─────────────────────────────────────
  activity: router({
    list: adminProcedure.input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
      action: z.string().optional(),
    })).query(async ({ input }) => {
      return getActivityLog(input.page, input.pageSize, input.action);
    }),
  }),

  // ─── Export ───────────────────────────────────────────────────
  export: router({
    leadsCSV: protectedProcedure.input(z.object({
      orderId: z.number(),
      orderItemId: z.number(),
    })).query(async ({ ctx, input }) => {
      const { leads: rows, fields } = await getLeadsForExport(input.orderItemId, input.orderId, ctx.user.id);
      if (rows.length === 0) return { csv: "", filename: "" };
      
      // Build CSV
      const headers = fields.length > 0
        ? fields.map(f => f.label)
        : Object.keys((rows[0].data as Record<string, unknown>) ?? {});
      const fieldNames = fields.length > 0
        ? fields.map(f => f.name)
        : Object.keys((rows[0].data as Record<string, unknown>) ?? {});
      
      const csvLines = [headers.join(",")];
      for (const row of rows) {
        const data = row.data as Record<string, unknown>;
        const values = fieldNames.map(name => {
          const val = data[name];
          const str = val != null ? String(val) : "";
          // Escape CSV values
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvLines.push(values.join(","));
      }
      
      return {
        csv: csvLines.join("\n"),
        filename: `leads-pedido-${input.orderId}-item-${input.orderItemId}.csv`,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
