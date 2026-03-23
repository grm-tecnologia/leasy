import crypto from "crypto";
import type { Express, Request, Response } from "express";
import { getPayment } from "./mercadopago";
import { getOrderById, updateOrder, getOrderItems, getCategoryById, getLeadsForCategory, getUserById } from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import type { FieldDefinition } from "../drizzle/schema";

/**
 * Check if a payment_provider_id has already been processed (idempotency guard).
 * Returns true if the payment was already recorded in the database.
 */
async function isPaymentAlreadyProcessed(paymentProviderId: string): Promise<boolean> {
  const { getDb } = await import("./db");
  const db = await getDb();
  if (!db) return false;
  const { orders } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const existing = await db.select({ id: orders.id })
    .from(orders)
    .where(eq(orders.paymentProviderId, paymentProviderId))
    .limit(1);
  return existing.length > 0;
}

/**
 * Process a paid order: generate CSV downloads and notify owner.
 * Extracted so it can be called from both webhook and manual confirmation.
 *
 * Idempotency: checks paymentProviderId before processing.
 * The entire status update + paymentProviderId write happens in a single query
 * protected by the UNIQUE constraint on paymentProviderId.
 */
export async function processOrderPayment(orderId: number, paymentId: string, paymentDetails?: Record<string, unknown>) {
  const order = await getOrderById(orderId);
  if (!order) {
    console.warn(`[Webhook] Order ${orderId} not found`);
    return false;
  }

  // Skip if already paid (quick check)
  if (order.status === "paid") {
    console.log(`[Webhook] Order ${orderId} already paid, skipping`);
    return true;
  }

  // Idempotency: check if this payment_id was already processed for any order
  const paymentProviderId = String(paymentId);
  if (await isPaymentAlreadyProcessed(paymentProviderId)) {
    console.log(`[Webhook] Payment ${paymentProviderId} already processed, skipping (idempotent)`);
    return true;
  }

  // Update order status atomically with paymentProviderId (UNIQUE constraint prevents duplicates)
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { orders: ordersTable } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Only update if still pending — atomic check-and-set
    const result = await db.update(ordersTable)
      .set({
        status: "paid",
        paymentId,
        paymentProviderId,
        paymentDetails: paymentDetails ?? {},
      })
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, "pending")));

    // If no rows were updated, the order was already processed (race condition guard)
    if ((result as any)[0]?.affectedRows === 0) {
      console.log(`[Webhook] Order ${orderId} was already processed (race condition), skipping`);
      return true;
    }
  } catch (err: any) {
    // Duplicate key error on paymentProviderId = idempotent duplicate
    if (err?.code === "ER_DUP_ENTRY" || err?.message?.includes("Duplicate entry")) {
      console.log(`[Webhook] Duplicate paymentProviderId ${paymentProviderId}, skipping (idempotent)`);
      return true;
    }
    throw err;
  }

  // Generate download files for each order item
  const items = await getOrderItems(orderId);
  for (const item of items) {
    try {
      const { leads: leadRows } = await getLeadsForCategory(
        item.categoryId,
        (item.filters as Record<string, string>) ?? {},
        1,
        item.leadCount
      );

      const category = await getCategoryById(item.categoryId);
      const fields = (category?.fieldDefinitions as FieldDefinition[]) || [];
      const headers = fields.map(f => f.label);
      const csvRows = leadRows.map(lead => {
        const data = lead.data as Record<string, unknown>;
        return fields.map(f => {
          const val = data[f.name];
          if (val === undefined || val === null) return "";
          const str = String(val);
          // Escape CSV values containing commas or quotes
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",");
      });
      const csv = [headers.join(","), ...csvRows].join("\n");

      const downloadKey = `downloads/${orderId}/${item.id}-${nanoid(8)}.csv`;
      const { url } = await storagePut(downloadKey, Buffer.from(csv, "utf-8"), "text/csv");

      // Update order item with download URL
      const { getDb } = await import("./db");
      const db = await getDb();
      if (db) {
        const { orderItems: orderItemsTable } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        await db.update(orderItemsTable)
          .set({ downloadUrl: url, downloadKey })
          .where(eq(orderItemsTable.id, item.id));
      }
    } catch (err) {
      console.error(`[Webhook] Failed to generate download for order item ${item.id}:`, err);
    }
  }

  // Send payment approved email to customer
  try {
    const { sendPaymentApprovedEmail } = await import("./email");
    const user = await getUserById(order.userId);
    if (user?.email) {
      const downloadCount = items.filter(i => i.downloadUrl).length || items.length;
      sendPaymentApprovedEmail(
        user.email,
        user.name ?? "",
        orderId,
        order.totalCents,
        downloadCount
      ).catch(err => console.warn("[Webhook] Failed to send payment email:", err));
    }
  } catch (err) {
    console.warn("[Webhook] Failed to send payment email:", err);
  }

  // Notify owner
  try {
    const categoryNames: string[] = [];
    for (const item of items) {
      const cat = await getCategoryById(item.categoryId);
      categoryNames.push(cat?.name ?? "Desconhecido");
    }
    await notifyOwner({
      title: "Nova venda de leads!",
      content: `Pedido #${orderId} - R$ ${(order.totalCents / 100).toFixed(2)}\nNichos: ${categoryNames.join(", ")}`,
    });
  } catch (err) {
    console.warn("[Webhook] Failed to notify owner:", err);
  }

  return true;
}


/**
 * Verify Mercado Pago webhook signature.
 * Returns true if signature is valid or if no secret is configured (graceful degradation).
 */
function verifyWebhookSignature(req: Request): boolean {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // No secret configured, skip verification (log warning)
    console.warn("[Webhook] MP_WEBHOOK_SECRET not configured, skipping signature verification");
    return true;
  }

  const xSignature = req.headers["x-signature"] as string;
  const xRequestId = req.headers["x-request-id"] as string;
  
  if (!xSignature || !xRequestId) {
    console.warn("[Webhook] Missing x-signature or x-request-id headers");
    return false;
  }

  // Parse x-signature header: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach(part => {
    const [key, value] = part.split("=", 2);
    if (key && value) parts[key.trim()] = value.trim();
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) {
    console.warn("[Webhook] Invalid x-signature format");
    return false;
  }

  // Build the manifest string
  const dataId = req.query["data.id"] || (req.body?.data?.id ?? "");
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  
  // Generate HMAC
  const hmac = crypto.createHmac("sha256", webhookSecret).update(manifest).digest("hex");
  
  return hmac === v1;
}

/**
 * Register Mercado Pago webhook route on the Express app.
 */
export function registerWebhooks(app: Express) {
  // Mercado Pago IPN/Webhook
  app.post("/api/webhooks/mercadopago", async (req: Request, res: Response) => {
    try {
      // Verify webhook signature
      if (!verifyWebhookSignature(req)) {
        console.warn("[Webhook] Invalid signature, rejecting");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const { type, data } = req.body;

      // Mercado Pago sends different notification types
      // We only care about "payment" notifications
      if (type === "payment" && data?.id) {
        const paymentId = String(data.id);
        console.log(`[Webhook] Received payment notification: ${paymentId}`);

        // Get payment details from Mercado Pago
        const payment = await getPayment(paymentId);

        if (payment.status === "approved") {
          const orderId = parseInt(payment.external_reference, 10);
          if (!isNaN(orderId)) {
            await processOrderPayment(orderId, paymentId, payment);
            console.log(`[Webhook] Order ${orderId} confirmed as paid`);
          }
        } else {
          console.log(`[Webhook] Payment ${paymentId} status: ${payment.status}`);
          // Handle failed payments
          if (payment.status === "rejected" || payment.status === "cancelled") {
            const orderId = parseInt(payment.external_reference, 10);
            if (!isNaN(orderId)) {
              await updateOrder(orderId, { status: "failed", paymentId, paymentDetails: payment });
            }
          }
        }
      }

      // Always respond 200 to Mercado Pago (idempotent — duplicates are handled gracefully)
      res.status(200).json({ received: true });
    } catch (err) {
      console.error("[Webhook] Error processing:", err);
      // Still respond 200 to avoid retries for broken logic
      res.status(200).json({ received: true });
    }
  });

  // Health check for webhook
  app.get("/api/webhooks/mercadopago", (_req: Request, res: Response) => {
    res.json({ status: "ok", service: "mercadopago-webhook" });
  });
}
