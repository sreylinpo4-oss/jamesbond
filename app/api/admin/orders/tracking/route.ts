import { NextResponse } from "next/server";

import { TRACKING_STATUSES } from "@/lib/admin-store";
import { createClient } from "@/lib/supabase/server";

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
    return NextResponse.json({ error: "Invalid shipment update." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const orderNumber = readText(input.orderNumber, 32);
  const status =
    typeof input.status === "string" &&
    TRACKING_STATUSES.some((trackingStatus) => trackingStatus === input.status)
      ? input.status
      : null;
  const location = readText(input.location, 160);
  const note =
    input.note === undefined
      ? ""
      : typeof input.note === "string" && input.note.trim().length <= 500
        ? input.note.trim()
        : null;

  if (
    !orderNumber ||
    !/^FL-[A-F0-9]{12}$/.test(orderNumber) ||
    !status ||
    !location ||
    note === null
  ) {
    return NextResponse.json({ error: "Provide a valid order, status, location, and note." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Sign in with a store administrator account." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Failed to verify store administrator role:", profileError);
    return NextResponse.json({ error: "Unable to verify administrator access." }, { status: 500 });
  }
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Store administrator access required." }, { status: 403 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,status,payment_status")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (orderError) {
    console.error("Failed to find order for shipment update:", orderError);
    return NextResponse.json({ error: "The order could not be checked." }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ error: "A cancelled order cannot receive shipment updates." }, { status: 409 });
  }
  if (order.payment_status !== "paid" && order.payment_status !== "cod_due") {
    return NextResponse.json({ error: "Shipment updates are unavailable until the order is paid or marked for cash on delivery." }, { status: 409 });
  }

  const { data: update, error: insertError } = await supabase
    .from("order_tracking_updates")
    .insert({ order_id: order.id, status, location, note })
    .select("status,location,note,created_at")
    .single();
  if (insertError || !update) {
    console.error("Failed to save shipment tracking update:", insertError);
    return NextResponse.json({ error: "The shipment update could not be saved." }, { status: 500 });
  }

  return NextResponse.json({
    update: {
      status: update.status,
      location: update.location,
      note: update.note,
      createdAt: update.created_at,
    },
  });
}
