import { NextResponse } from "next/server";

import { createPayWayCheckoutForm, assertPayWayConfigured } from "@/lib/payway";
import { createClient } from "@/lib/supabase/server";

type CheckoutItem = {
  productId: number;
  quantity: number;
};

type CreatedOrder = {
  id: string;
  order_number: string;
  total_cents: number;
  payment_method: "aba_payway" | "cash_on_delivery";
  payment_status: string;
  subtotal_cents?: number;
  shipping_cents?: number;
  currency?: "USD" | "KHR";
};

function isCheckoutItem(value: unknown): value is CheckoutItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    Number.isSafeInteger(item.productId) &&
    Number(item.productId) > 0 &&
    Number.isSafeInteger(item.quantity) &&
    Number(item.quantity) >= 1 &&
    Number(item.quantity) <= 99
  );
}

function readText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= maxLength ? text : null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "JSON request body required." }, { status: 415 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid checkout details." }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const items = input.items;
  const address = input.address as Record<string, unknown> | null;
  const idempotencyKey = input.idempotencyKey;
  const paymentMethod = input.paymentMethod;

  if (
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > 50 ||
    !items.every(isCheckoutItem) ||
    new Set(items.map((item) => item.productId)).size !== items.length ||
    typeof idempotencyKey !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey) ||
    (paymentMethod !== "aba_payway" && paymentMethod !== "cash_on_delivery") ||
    !address ||
    typeof address !== "object"
  ) {
    return NextResponse.json({ error: "Invalid bag or payment details." }, { status: 400 });
  }

  const customerName = readText(address.name, 120);
  const customerPhone = readText(address.phone, 24);
  const addressLine1 = readText(address.line1, 200);
  const addressLine2 = typeof address.line2 === "string" ? address.line2.trim().slice(0, 200) : "";
  const city = readText(address.city, 100);
  const postalCode = typeof address.postalCode === "string" ? address.postalCode.trim().slice(0, 32) : "";
  const country = readText(address.country, 100);
  const notes = typeof address.notes === "string" ? address.notes.trim().slice(0, 1000) : "";

  if (!customerName || !customerPhone || !addressLine1 || !city || !country) {
    return NextResponse.json({ error: "Complete all required delivery details." }, { status: 400 });
  }

  if (paymentMethod === "aba_payway") {
    try {
      assertPayWayConfigured();
    } catch {
      return NextResponse.json(
        { error: "ABA PayWay is not configured for this store yet." },
        { status: 503 },
      );
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.email) {
    return NextResponse.json({ error: "Sign in with an account email to place an order." }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("create_store_order", {
    p_items: items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_idempotency_key: idempotencyKey,
    p_payment_method: paymentMethod,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_address_line1: addressLine1,
    p_address_line2: addressLine2,
    p_city: city,
    p_postal_code: postalCode,
    p_country: country,
    p_delivery_notes: notes,
  });

  if (error) {
    const isStockError = error.message.includes("Insufficient stock");
    return NextResponse.json(
      {
        error: isStockError
          ? "One or more items are out of stock. Please update your bag."
          : "We could not place this order. Please review the delivery details and try again.",
      },
      { status: isStockError ? 409 : 400 },
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Order service returned an invalid response." }, { status: 502 });
  }

  const order = data as CreatedOrder;
  if (
    typeof order.id !== "string" ||
    typeof order.order_number !== "string" ||
    !Number.isSafeInteger(order.total_cents)
  ) {
    return NextResponse.json({ error: "Order service returned an invalid response." }, { status: 502 });
  }

  if (order.payment_method === "cash_on_delivery") {
    return NextResponse.json({
      orderNumber: order.order_number,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
    });
  }

  const { data: savedOrder, error: orderError } = await supabase
    .from("orders")
    .select("order_number,subtotal_cents,shipping_cents,currency")
    .eq("id", order.id)
    .single();

  if (orderError || !savedOrder) {
    return NextResponse.json({ error: "Unable to prepare the payment for this order." }, { status: 502 });
  }

  try {
    const checkout = createPayWayCheckoutForm(
      savedOrder,
      { name: customerName, email: user.email, phone: customerPhone },
    );
    return NextResponse.json({
      orderNumber: order.order_number,
      paymentMethod: order.payment_method,
      checkout,
    });
  } catch (error) {
    console.error("PayWay checkout initialization failed:", error);
    return NextResponse.json(
      {
        error: "The order was saved, but payment could not be started. Contact support with your order number.",
        orderNumber: order.order_number,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const orderNumber = new URL(request.url).searchParams.get("order");
  if (!orderNumber || !/^FL-[A-F0-9]{12}$/.test(orderNumber)) {
    return NextResponse.json({ error: "A valid order number is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in to view this order." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number,status,payment_method,payment_status,currency,subtotal_cents,shipping_cents,total_cents,created_at,order_items(product_name,quantity,unit_price_cents,line_total_cents)",
    )
    .eq("order_number", orderNumber)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ order: data });
}
