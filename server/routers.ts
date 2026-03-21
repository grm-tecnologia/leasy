import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { transcribeAudio } from "./_core/voiceTranscription";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ─────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getProfileByUserId(ctx.user.id);
    }),

    save: protectedProcedure
      .input(z.object({
        formType: z.enum(["basic", "gold"]),
        fullName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        headline: z.string().optional(),
        summary: z.string().optional(),
        currentRole: z.string().optional(),
        currentCompany: z.string().optional(),
        yearsExperience: z.number().optional(),
        education: z.any().optional(),
        experience: z.any().optional(),
        skills: z.any().optional(),
        certifications: z.any().optional(),
        languages: z.any().optional(),
        targetRole: z.string().optional(),
        targetIndustry: z.string().optional(),
        salaryExpectation: z.string().optional(),
        linkedinUrl: z.string().optional(),
        portfolioUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profileId = await db.upsertProfile({ ...input, userId: ctx.user.id });
        return { profileId };
      }),
  }),

  // ─── Voice Transcription ─────────────────────────────────────────────────
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language || "pt",
          prompt: "Transcreva o audio do usuario sobre sua experiencia profissional, habilidades e objetivos de carreira.",
        });
        if ("error" in result) {
          throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
        }
        return { text: result.text, language: result.language, duration: result.duration };
      }),

    upload: protectedProcedure
      .input(z.object({ base64: z.string(), mimeType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.mimeType.includes("webm") ? "webm" : input.mimeType.includes("wav") ? "wav" : "mp3";
        const key = `audio/${ctx.user.id}/${Date.now()}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── AI Generation ───────────────────────────────────────────────────────
  generate: router({
    cv: protectedProcedure
      .input(z.object({ profileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (user.plan === "basic" && user.generationsUsed >= user.generationsLimit) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Limite de geracoes atingido. Faca upgrade para o plano Gold." });
        }
        const profile = await db.getProfileByUserId(user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil nao encontrado." });

        const genId = await db.createGeneration({
          userId: user.id, profileId: input.profileId, type: "cv_pdf", status: "processing", inputData: profile,
        });

        try {
          const result = await invokeLLM({
            messages: [
              { role: "system", content: `Voce e um especialista em criacao de curriculos otimizados para ATS (Applicant Tracking Systems). Gere um curriculo profissional em formato HTML completo e estilizado com CSS inline. O curriculo deve:
1. Ter design limpo e profissional com fonte sans-serif
2. Incluir palavras-chave estrategicas da area do candidato em texto branco (cor #ffffff sobre fundo branco) no final do documento para otimizacao ATS
3. Organizar as secoes: Dados Pessoais, Resumo Profissional, Experiencia, Formacao, Habilidades, Certificacoes, Idiomas
4. Usar formatacao que destaque conquistas com numeros e metricas
5. Ser compativel com impressao em A4
Responda APENAS com o HTML completo, sem explicacoes.` },
              { role: "user", content: `Gere o curriculo para: ${JSON.stringify(profile)}` },
            ],
          });

          const htmlContent = result.choices[0]?.message?.content as string || "";
          const tokens = result.usage?.total_tokens || 0;

          await db.updateGeneration(genId!, {
            status: "completed", outputData: { html: htmlContent }, tokensUsed: tokens,
          });
          await db.incrementGenerationsUsed(user.id);

          return { generationId: genId, html: htmlContent };
        } catch (error) {
          await db.updateGeneration(genId!, { status: "failed" });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao gerar curriculo." });
        }
      }),

    linkedin: protectedProcedure
      .input(z.object({
        profileId: z.number(),
        type: z.enum(["about", "skills", "hashtags", "full"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = ctx.user;
        if (user.plan === "basic" && user.generationsUsed >= user.generationsLimit) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Limite de geracoes atingido. Faca upgrade para o plano Gold." });
        }
        const profile = await db.getProfileByUserId(user.id);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Perfil nao encontrado." });

        const genType = input.type === "full" ? "full_optimization" : input.type === "about" ? "linkedin_about" : input.type === "skills" ? "linkedin_skills" : "linkedin_hashtags";
        const genId = await db.createGeneration({
          userId: user.id, profileId: input.profileId, type: genType, status: "processing", inputData: profile,
        });

        const prompts: Record<string, string> = {
          about: `Voce e um especialista em otimizacao de perfis LinkedIn. Gere um texto otimizado para a secao "Sobre" do LinkedIn. O texto deve:
1. Ter entre 200-300 palavras
2. Incluir palavras-chave relevantes para a area
3. Contar uma historia profissional envolvente
4. Terminar com um call-to-action
5. Incluir hashtags relevantes ao final (5-10)
Responda em JSON: {"about": "texto", "hashtags": ["#tag1"]}`,
          skills: `Voce e um especialista em otimizacao de perfis LinkedIn. Gere uma lista de 70+ habilidades relevantes para o perfil. As habilidades devem:
1. Incluir habilidades tecnicas especificas da area
2. Incluir habilidades comportamentais (soft skills)
3. Incluir ferramentas e tecnologias relevantes
4. Ser ordenadas por relevancia
5. Incluir variacoes de termos (ex: "Gestao de Projetos", "Project Management")
Responda em JSON: {"skills": ["skill1", "skill2", ...]}`,
          hashtags: `Voce e um especialista em SEO para LinkedIn. Gere hashtags estrategicas para o perfil. Inclua:
1. 20 hashtags da area de atuacao
2. 10 hashtags de tendencias do setor
3. 5 hashtags de localizacao/mercado
Responda em JSON: {"hashtags": ["#tag1", "#tag2", ...], "categories": {"area": [...], "tendencias": [...], "mercado": [...]}}`,
          full: `Voce e um especialista em otimizacao completa de perfis LinkedIn. Gere uma otimizacao completa incluindo:
1. Texto para secao "Sobre" (200-300 palavras com palavras-chave)
2. Lista de 70+ habilidades relevantes
3. 35 hashtags estrategicas categorizadas
4. Sugestao de headline otimizada
5. Recomendacoes de melhoria do perfil
Responda em JSON: {"about": "texto", "headline": "sugestao", "skills": [...], "hashtags": {"area": [...], "tendencias": [...], "mercado": [...]}, "recommendations": [...]}`,
        };

        try {
          const result = await invokeLLM({
            messages: [
              { role: "system", content: prompts[input.type] || prompts.full },
              { role: "user", content: `Perfil: ${JSON.stringify(profile)}` },
            ],
            response_format: { type: "json_object" },
          });

          const content = result.choices[0]?.message?.content as string || "{}";
          const tokens = result.usage?.total_tokens || 0;
          let parsed;
          try { parsed = JSON.parse(content); } catch { parsed = { raw: content }; }

          await db.updateGeneration(genId!, {
            status: "completed", outputData: parsed, tokensUsed: tokens,
          });
          await db.incrementGenerationsUsed(user.id);

          return { generationId: genId, data: parsed };
        } catch (error) {
          await db.updateGeneration(genId!, { status: "failed" });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Falha ao gerar otimizacao LinkedIn." });
        }
      }),

    messageTemplate: protectedProcedure
      .input(z.object({
        targetRole: z.enum(["recruiter", "manager", "director"]),
        context: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const profile = await db.getProfileByUserId(ctx.user.id);
        const result = await invokeLLM({
          messages: [
            { role: "system", content: `Voce e um especialista em networking profissional. Gere uma mensagem personalizada para abordar um(a) ${input.targetRole === "recruiter" ? "recrutador(a)" : input.targetRole === "manager" ? "gestor(a) de area" : "diretor(a)/VP"} no LinkedIn. A mensagem deve ser:
1. Profissional mas cordial
2. Curta (max 300 caracteres para InMail)
3. Personalizada com dados do perfil
4. Com call-to-action claro
Responda em JSON: {"message": "texto da mensagem", "subject": "assunto opcional"}` },
            { role: "user", content: `Perfil: ${JSON.stringify(profile || {})}. Contexto adicional: ${input.context || "Nenhum"}` },
          ],
          response_format: { type: "json_object" },
        });
        const content = result.choices[0]?.message?.content as string || "{}";
        let parsed;
        try { parsed = JSON.parse(content); } catch { parsed = { message: content }; }
        return parsed;
      }),
  }),

  // ─── Generations History ─────────────────────────────────────────────────
  generations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getGenerationsByUserId(ctx.user.id);
    }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getGenerationById(input.id);
      }),
  }),

  // ─── SSI Actions ─────────────────────────────────────────────────────────
  ssi: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await db.seedSsiActionsForUser(ctx.user.id);
      return db.getSsiActionsByUserId(ctx.user.id);
    }),
    toggle: protectedProcedure
      .input(z.object({ id: z.number(), completed: z.boolean() }))
      .mutation(async ({ input }) => {
        await db.toggleSsiAction(input.id, input.completed);
        return { success: true };
      }),
  }),

  // ─── Message Templates ───────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      await db.seedDefaultTemplates();
      return db.getMessageTemplates(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        targetRole: z.enum(["recruiter", "manager", "director"]),
        title: z.string(),
        content: z.string(),
        industry: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessageTemplate({ ...input, userId: ctx.user.id });
        return { success: true };
      }),
    trackUsage: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.incrementTemplateUsage(input.id);
        return { success: true };
      }),
  }),

  // ─── Plans ───────────────────────────────────────────────────────────────
  plans: router({
    upgrade: protectedProcedure.mutation(async ({ ctx }) => {
      await db.updateUserPlan(ctx.user.id, "gold");
      return { success: true, plan: "gold" };
    }),
    downgrade: protectedProcedure.mutation(async ({ ctx }) => {
      await db.updateUserPlan(ctx.user.id, "basic");
      return { success: true, plan: "basic" };
    }),
  }),

  // ─── Admin ───────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getAdminStats();
    }),
    users: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    updateRole: adminProcedure
      .input(z.object({ userId: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(async ({ input }) => {
        await db.updateUserRole(input.userId, input.role);
        return { success: true };
      }),
    recentGenerations: adminProcedure.query(async () => {
      return db.getRecentGenerations();
    }),
  }),
});

export type AppRouter = typeof appRouter;
