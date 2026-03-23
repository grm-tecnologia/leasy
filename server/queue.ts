/**
 * Background job queue for lead processing using BullMQ + Redis.
 *
 * The upload.processLeads procedure now only validates the mapping and
 * enqueues a job to `lead-processing-queue`. A dedicated worker picks up
 * jobs, reads the file from S3/local, processes rows in chunks of 500,
 * and updates the upload_batches status.
 */
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { ENV } from "./_core/env";

// ─── Redis Connection ──────────────────────────────────────────────

let _redisConnection: IORedis | null = null;

function getRedisConnection(): IORedis {
  if (!_redisConnection) {
    _redisConnection = new IORedis(ENV.redisUrl, {
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
    });
    _redisConnection.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
    });
  }
  return _redisConnection;
}

// ─── Queue Definition ──────────────────────────────────────────────

export type LeadProcessingJobData = {
  batchId: string;
  categoryId: number;
  columnMapping: Record<string, string>;
  newFields: Array<{
    name: string;
    label: string;
    type: string;
    filterable: boolean;
    isContact: boolean;
  }>;
  rows: Array<Record<string, string>>;
  uploadedBy: number;
};

let _queue: Queue<LeadProcessingJobData> | null = null;

export function getLeadProcessingQueue(): Queue<LeadProcessingJobData> {
  if (!_queue) {
    _queue = new Queue<LeadProcessingJobData>("lead-processing-queue", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return _queue;
}

/**
 * Enqueue a lead processing job. Returns the job ID.
 */
export async function enqueueLeadProcessing(data: LeadProcessingJobData): Promise<string> {
  const queue = getLeadProcessingQueue();
  const job = await queue.add(`process-${data.batchId}`, data, {
    jobId: data.batchId, // prevent duplicate jobs for same batch
  });
  return job.id ?? data.batchId;
}

// ─── Worker ────────────────────────────────────────────────────────

let _worker: Worker<LeadProcessingJobData> | null = null;

/**
 * Start the lead processing worker.
 * Call this once during server startup.
 */
export function startLeadProcessingWorker(): void {
  if (_worker) return; // already started

  _worker = new Worker<LeadProcessingJobData>(
    "lead-processing-queue",
    async (job: Job<LeadProcessingJobData>) => {
      const { batchId, categoryId, columnMapping, newFields, rows, uploadedBy } = job.data;
      console.log(`[Worker] Processing batch ${batchId}: ${rows.length} rows`);

      // Dynamic imports to avoid circular dependencies
      const {
        getUploadBatch, updateUploadBatch, getCategoryById, updateCategory,
        insertLeads, updateCategoryLeadCount,
      } = await import("./db");
      const { sanitizeObject } = await import("./security");
      const { logActivity } = await import("./db");
      const { notifyOwner } = await import("./_core/notification");

      try {
        // Update status to processing
        await updateUploadBatch(batchId, { status: "processing", totalRows: rows.length, processedRows: 0 });

        // If there are new fields, update category field definitions
        if (newFields.length > 0) {
          const category = await getCategoryById(categoryId);
          if (category) {
            const existingFields = (category.fieldDefinitions as any[]) || [];
            const existingNames = new Set(existingFields.map((f: any) => f.name));
            const fieldsToAdd = newFields.filter(f => !existingNames.has(f.name));
            if (fieldsToAdd.length > 0) {
              const updatedFields = [...existingFields, ...fieldsToAdd];
              await updateCategory(categoryId, { fieldDefinitions: updatedFields as any });
            }
          }
        }

        // Process rows in chunks of 500
        const CHUNK_SIZE = 500;
        let processedCount = 0;

        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);

          const leadsToInsert = chunk.map(row => {
            const mappedData: Record<string, unknown> = {};
            for (const [originalCol, targetField] of Object.entries(columnMapping)) {
              if (targetField && targetField !== "__skip__") {
                const rawValue = row[originalCol];
                mappedData[targetField] = rawValue ?? "";
              }
            }
            return {
              categoryId,
              data: sanitizeObject(mappedData),
              batchId,
              isActive: true,
            };
          });

          await insertLeads(leadsToInsert);
          processedCount += chunk.length;

          // Update progress
          await updateUploadBatch(batchId, { processedRows: processedCount });

          // Update job progress for BullMQ tracking
          await job.updateProgress(Math.round((processedCount / rows.length) * 100));
        }

        // Update category lead count
        await updateCategoryLeadCount(categoryId);

        // Mark batch as completed
        await updateUploadBatch(batchId, { status: "completed", processedRows: processedCount });

        // Log activity
        await logActivity({
          userId: uploadedBy,
          action: "lead.upload",
          entityType: "category",
          entityId: String(categoryId),
          details: { batchId, totalRows: rows.length, processedRows: processedCount },
        });

        // Notify owner
        const category = await getCategoryById(categoryId);
        await notifyOwner({
          title: "Upload de leads concluído",
          content: `Batch ${batchId}: ${processedCount} leads processados para ${category?.name ?? "categoria desconhecida"}.`,
        }).catch(() => {});

        console.log(`[Worker] Batch ${batchId} completed: ${processedCount} leads processed`);
      } catch (err: any) {
        console.error(`[Worker] Batch ${batchId} failed:`, err);
        await updateUploadBatch(batchId, {
          status: "failed",
          errorMessage: err?.message ?? "Erro desconhecido no processamento",
        });
        throw err; // re-throw so BullMQ can retry
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 2, // process up to 2 batches in parallel
      limiter: {
        max: 5,
        duration: 60000, // max 5 jobs per minute
      },
    }
  );

  _worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  _worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[Worker] Lead processing worker started");
}

/**
 * Gracefully shut down the worker and queue.
 */
export async function shutdownQueue(): Promise<void> {
  if (_worker) {
    await _worker.close();
    _worker = null;
  }
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
  if (_redisConnection) {
    _redisConnection.disconnect();
    _redisConnection = null;
  }
}
