import { ENV } from "./_core/env";

const MP_API = "https://api.mercadopago.com";

function headers() {
  return {
    Authorization: `Bearer ${ENV.mercadoPagoAccessToken}`,
    "Content-Type": "application/json",
  };
}

export type MpPreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
  currency_id?: string;
};

export type MpPreference = {
  id: string;
  init_point: string;
  sandbox_init_point: string;
};

/**
 * Create a Mercado Pago checkout preference.
 * Returns the preference with init_point URL for redirect.
 */
export async function createPreference(opts: {
  items: MpPreferenceItem[];
  externalReference: string;
  backUrls: {
    success: string;
    failure: string;
    pending: string;
  };
  notificationUrl?: string;
}): Promise<MpPreference> {
  const body = {
    items: opts.items.map((item) => ({
      ...item,
      currency_id: item.currency_id ?? "BRL",
    })),
    external_reference: opts.externalReference,
    back_urls: opts.backUrls,
    auto_return: "approved",
    ...(opts.notificationUrl ? { notification_url: opts.notificationUrl } : {}),
  };

  const res = await fetch(`${MP_API}/checkout/preferences`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago error: ${res.status} - ${err}`);
  }

  return res.json();
}

/**
 * Get payment details by payment ID.
 */
export async function getPayment(paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Mercado Pago error: ${res.status} - ${err}`);
  }

  return res.json();
}
