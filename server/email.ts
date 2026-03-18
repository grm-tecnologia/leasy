import { ENV } from "./_core/env";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "Leasy <vendas@leasy.app.br>";
const SUPPORT_EMAIL = "vendas@leasy.app.br";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!ENV.resendApiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email");
    return false;
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      console.error("[Email] Failed to send:", error);
      return false;
    }

    console.log(`[Email] Sent "${params.subject}" to ${params.to}`);
    return true;
  } catch (err) {
    console.error("[Email] Error sending email:", err);
    return false;
  }
}

// ─── Email Templates ────────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#141414;border-radius:12px;border:1px solid #262626;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #262626;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Leasy</span>
                    <span style="font-size:12px;color:#f97316;margin-left:8px;vertical-align:super;">●</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #262626;">
              <p style="margin:0;font-size:12px;color:#666;line-height:1.5;">
                Este e-mail foi enviado automaticamente pela <span style="color:#f97316;">Leasy</span>.<br>
                Se você não solicitou esta ação, ignore este e-mail.<br><br>
                <a href="https://leasy.app.br/privacidade" style="color:#888;text-decoration:underline;">Política de Privacidade</a> · 
                <a href="https://leasy.app.br/termos" style="color:#888;text-decoration:underline;">Termos de Uso</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Welcome Email ──────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
  const name = userName || "Usuário";
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">
      Bem-vindo à Leasy! 🎯
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.6;">
      Olá, <strong style="color:#ffffff;">${name}</strong>! Sua conta foi criada com sucesso.
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.6;">
      A Leasy é a plataforma inteligente para compra de leads qualificados. Com nosso sistema, você pode:
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:12px 16px;background-color:#1a1a1a;border-radius:8px;border-left:3px solid #f97316;">
          <p style="margin:0 0 8px;font-size:14px;color:#ffffff;font-weight:600;">✅ Filtrar leads por nicho, cidade, estado e mais</p>
          <p style="margin:0 0 8px;font-size:14px;color:#ffffff;font-weight:600;">✅ Comprar pacotes com preços acessíveis</p>
          <p style="margin:0;font-size:14px;color:#ffffff;font-weight:600;">✅ Receber seus leads em CSV instantaneamente</p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color:#f97316;border-radius:8px;">
          <a href="https://leasy.app.br/dashboard" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">
            Acessar Meu Painel →
          </a>
        </td>
      </tr>
    </table>
  `);

  return sendEmail({ to, subject: "Bem-vindo à Leasy! 🎯 Sua conta está pronta", html });
}

// ─── Order Confirmation Email ───────────────────────────────────────

export async function sendOrderConfirmationEmail(
  to: string,
  userName: string,
  orderId: number,
  totalCents: number,
  items: Array<{ categoryName: string; leadCount: number; priceCents: number }>
): Promise<boolean> {
  const name = userName || "Usuário";
  const total = (totalCents / 100).toFixed(2).replace(".", ",");

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#a3a3a3;font-size:14px;">${item.categoryName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#a3a3a3;font-size:14px;text-align:center;">${item.leadCount}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #262626;color:#ffffff;font-size:14px;text-align:right;">R$ ${(item.priceCents / 100).toFixed(2).replace(".", ",")}</td>
    </tr>
  `).join("");

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">
      Pedido Confirmado! ✅
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.6;">
      Olá, <strong style="color:#ffffff;">${name}</strong>! Seu pedido <strong style="color:#f97316;">#${orderId}</strong> foi recebido e está aguardando pagamento.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;background-color:#1a1a1a;border-radius:8px;overflow:hidden;">
      <tr style="background-color:#262626;">
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#a3a3a3;text-transform:uppercase;">Nicho</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#a3a3a3;text-transform:uppercase;text-align:center;">Leads</td>
        <td style="padding:10px 12px;font-size:12px;font-weight:600;color:#a3a3a3;text-transform:uppercase;text-align:right;">Valor</td>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding:12px;color:#ffffff;font-size:14px;font-weight:600;">Total</td>
        <td style="padding:12px;color:#f97316;font-size:18px;font-weight:700;text-align:right;">R$ ${total}</td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">
      Após a confirmação do pagamento, seus leads estarão disponíveis para download no seu painel.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color:#f97316;border-radius:8px;">
          <a href="https://leasy.app.br/dashboard/pedidos" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">
            Ver Meus Pedidos →
          </a>
        </td>
      </tr>
    </table>
  `);

  return sendEmail({ to, subject: `Pedido #${orderId} confirmado — Leasy`, html });
}

// ─── Payment Approved Email ─────────────────────────────────────────

export async function sendPaymentApprovedEmail(
  to: string,
  userName: string,
  orderId: number,
  totalCents: number,
  downloadCount: number
): Promise<boolean> {
  const name = userName || "Usuário";
  const total = (totalCents / 100).toFixed(2).replace(".", ",");

  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.3;">
      Pagamento Aprovado! 💰
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.6;">
      Olá, <strong style="color:#ffffff;">${name}</strong>! O pagamento do seu pedido <strong style="color:#f97316;">#${orderId}</strong> foi aprovado com sucesso.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:20px;background-color:#1a1a1a;border-radius:8px;text-align:center;border:1px solid #262626;">
          <p style="margin:0 0 4px;font-size:14px;color:#a3a3a3;">Valor pago</p>
          <p style="margin:0 0 16px;font-size:32px;font-weight:700;color:#22c55e;">R$ ${total}</p>
          <p style="margin:0;font-size:14px;color:#a3a3a3;">
            ${downloadCount} arquivo${downloadCount > 1 ? "s" : ""} disponíve${downloadCount > 1 ? "is" : "l"} para download
          </p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 24px;font-size:16px;color:#a3a3a3;line-height:1.6;">
      Seus leads já estão prontos! Acesse seu painel para fazer o download dos arquivos CSV.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color:#22c55e;border-radius:8px;">
          <a href="https://leasy.app.br/dashboard/pedidos" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">
            Baixar Meus Leads →
          </a>
        </td>
      </tr>
    </table>
  `);

  return sendEmail({ to, subject: `Pagamento aprovado — Pedido #${orderId} — Leasy`, html });
}
