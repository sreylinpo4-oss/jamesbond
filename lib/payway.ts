import "server-only";

import { createHmac } from "node:crypto";

type PayWayOrder = {
  order_number: string;
  subtotal_cents: number;
  shipping_cents: number;
  currency: "USD" | "KHR";
};

type PayWayCustomer = {
  name: string;
  email: string;
  phone: string;
};

const purchaseHashFields = [
  "req_time",
  "merchant_id",
  "tran_id",
  "amount",
  "items",
  "shipping",
  "firstname",
  "lastname",
  "email",
  "phone",
  "type",
  "payment_option",
  "return_url",
  "cancel_url",
  "continue_success_url",
  "return_deeplink",
  "currency",
  "custom_fields",
  "return_params",
  "payout",
  "lifetime",
  "additional_params",
  "google_pay_token",
  "skip_success_page",
] as const;

export type PayWayCheckoutForm = {
  action: string;
  fields: Record<string, string>;
};

function getPayWayConfig() {
  const merchantId = process.env.PAYWAY_MERCHANT_ID;
  const apiKey = process.env.PAYWAY_API_KEY;
  const environment = process.env.PAYWAY_ENV ?? "sandbox";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!merchantId || !apiKey) {
    throw new Error("ABA PayWay merchant credentials are not configured.");
  }
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("PAYWAY_ENV must be either sandbox or production.");
  }
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be configured for PayWay callbacks.");
  }

  const baseUrl = new URL(siteUrl);
  if (
    baseUrl.protocol !== "https:" &&
    !(environment === "sandbox" && baseUrl.hostname === "localhost")
  ) {
    throw new Error("The PayWay site URL must use HTTPS.");
  }

  return {
    merchantId,
    apiKey,
    siteUrl: baseUrl.origin,
    action:
      environment === "production"
        ? "https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase"
        : "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  };
}

export function assertPayWayConfigured() {
  getPayWayConfig();
}

function hmacBase64(value: string, key: string) {
  return createHmac("sha512", key).update(value).digest("base64");
}

function formatMoney(cents: number, currency: "USD" | "KHR") {
  return currency === "KHR" ? String(Math.round(cents / 100)) : (cents / 100).toFixed(2);
}

export function createPayWayCheckoutForm(
  order: PayWayOrder,
  customer: PayWayCustomer,
): PayWayCheckoutForm {
  const { merchantId, apiKey, siteUrl, action } = getPayWayConfig();
  const [firstName, ...lastNameParts] = customer.name.trim().split(/\s+/);
  const reqTime = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const items = Buffer.from(
    JSON.stringify([
      {
        name: order.order_number,
        quantity: 1,
        price: Number(formatMoney(order.subtotal_cents, order.currency)),
      },
    ]),
  ).toString("base64");
  const returnParams = Buffer.from(
    JSON.stringify({ order_number: order.order_number }),
  ).toString("base64");
  const returnUrl = Buffer.from(
    `${siteUrl}/api/payments/aba/callback`,
  ).toString("base64");
  const cancelUrl = `${siteUrl}/checkout?payment=cancelled`;

  const fields: Record<(typeof purchaseHashFields)[number], string> = {
    req_time: reqTime,
    merchant_id: merchantId,
    tran_id: order.order_number,
    amount: formatMoney(order.subtotal_cents, order.currency),
    items,
    shipping: formatMoney(order.shipping_cents, order.currency),
    firstname: firstName.slice(0, 100),
    lastname: lastNameParts.join(" ").slice(0, 100),
    email: customer.email.slice(0, 50),
    phone: customer.phone.slice(0, 20),
    type: "purchase",
    payment_option: "",
    return_url: returnUrl,
    cancel_url: cancelUrl,
    continue_success_url: `${siteUrl}/confirmation?order=${encodeURIComponent(order.order_number)}`,
    return_deeplink: "",
    currency: order.currency,
    custom_fields: "",
    return_params: returnParams,
    payout: "",
    lifetime: "",
    additional_params: "",
    google_pay_token: "",
    skip_success_page: "0",
  };

  const signature = hmacBase64(
    purchaseHashFields.map((field) => fields[field]).join(""),
    apiKey,
  );

  return {
    action,
    fields: { ...fields, hash: signature },
  };
}

export async function checkPayWayTransaction(transactionId: string) {
  const { merchantId, apiKey } = getPayWayConfig();
  const reqTime = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const hash = hmacBase64(reqTime + merchantId + transactionId, apiKey);
  const environment = process.env.PAYWAY_ENV ?? "sandbox";
  const endpoint =
    environment === "production"
      ? "https://payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2"
      : "https://sandbox.payway.com.kh/api/payment-gateway/v1/payments/check-transaction-2";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      req_time: reqTime,
      merchant_id: merchantId,
      tran_id: transactionId,
      hash,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`ABA PayWay transaction verification failed (${response.status}).`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    throw new Error("ABA PayWay returned an invalid transaction status.");
  }

  const data = payload.data;
  if (!data || typeof data !== "object") {
    throw new Error("ABA PayWay returned an invalid transaction status.");
  }

  const result = data as {
    payment_status?: unknown;
    total_amount?: unknown;
    apv?: unknown;
  };
  const status = result.payment_status;
  const amount = Number(result.total_amount);

  if (
    typeof status !== "string" ||
    !["APPROVED", "PRE-AUTH", "PENDING", "DECLINED", "CANCELLED", "REFUNDED"].includes(status) ||
    !Number.isFinite(amount) ||
    amount < 0
  ) {
    throw new Error("ABA PayWay returned an invalid payment result.");
  }

  return {
    status,
    totalCents: Math.round(amount * 100),
    reference: typeof result.apv === "string" ? result.apv : "",
  };
}
