/**
 * Owner notification — sends email via Resend instead of Manus Forge.
 */
import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type NotificationPayload = {
  title: string;
  content: string;
};

const TITLE_MAX_LENGTH = 1200;
const CONTENT_MAX_LENGTH = 20000;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (input: NotificationPayload): NotificationPayload => {
  if (!isNonEmptyString(input.title)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification title is required." });
  }
  if (!isNonEmptyString(input.content)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Notification content is required." });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Title must be at most ${TITLE_MAX_LENGTH} characters.` });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Content must be at most ${CONTENT_MAX_LENGTH} characters.` });
  }
  return { title, content };
};

/**
 * Notify the project owner via email (Resend).
 * Falls back to console.log if email is not configured.
 */
export async function notifyOwner(payload: NotificationPayload): Promise<boolean> {
  const { title, content } = validatePayload(payload);
  const adminEmail = ENV.adminEmail;

  if (!adminEmail) {
    console.log(`[Notification] (no admin email configured) ${title}: ${content}`);
    return false;
  }

  if (!ENV.resendApiKey) {
    console.log(`[Notification] (no Resend API key) ${title}: ${content}`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Leasy Sistema <vendas@leasy.app.br>",
        to: [adminEmail],
        subject: `[Leasy] ${title}`,
        text: content,
        html: `<div style="font-family:sans-serif;padding:20px;background:#0f0f0f;color:#fff;">
          <h2 style="color:#f97316;margin:0 0 16px;">${title}</h2>
          <pre style="white-space:pre-wrap;color:#a3a3a3;font-size:14px;line-height:1.6;">${content}</pre>
          <hr style="border-color:#262626;margin:24px 0;" />
          <p style="font-size:12px;color:#666;">Notificacao automatica do sistema Leasy</p>
        </div>`,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(`[Notification] Email failed (${response.status}): ${detail}`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[Notification] Error sending email:", error);
    return false;
  }
}
