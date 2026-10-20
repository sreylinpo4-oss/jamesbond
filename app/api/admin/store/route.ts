import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type {
  AdminOrder,
  AdminStoreData,
  DiscountKind,
  FulfillmentStatus,
} from "@/lib/admin-store";

function isAdminOrderStatus(status: string): status is FulfillmentStatus {
  return ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].includes(status);
}

function displayOrderStatus(status: string): FulfillmentStatus {
  const normalized = status.charAt(0).toUpperCase() + status.slice(1);
  return isAdminOrderStatus(normalized) ? normalized : "Pending";
}

export async function GET() {
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

  const [productsResult, warehousesResult, inventoryResult, ordersResult, discountsResult] =
    await Promise.all([
      supabase.from("products").select("id,sku,name,price_cents,active").order("id"),
      supabase.from("warehouses").select("id,name,location").eq("active", true).order("name"),
      supabase.from("inventory").select("product_id,warehouse_id,quantity,low_stock_threshold"),
      supabase
        .from("orders")
        .select("order_number,customer_name,customer_email,created_at,total_cents,status,order_items(product_name,quantity),order_tracking_updates(status,location,note,created_at)")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("discounts")
        .select("id,name,kind,value,code,minimum_quantity,active")
        .order("created_at", { ascending: false }),
    ]);

  const queryErrors = [
    productsResult.error,
    warehousesResult.error,
    inventoryResult.error,
    ordersResult.error,
    discountsResult.error,
  ].filter((error) => error !== null);
  if (queryErrors.length) {
    console.error("Failed to load admin store data:", queryErrors);
    return NextResponse.json({ error: "Store data could not be loaded." }, { status: 500 });
  }

  const stockByProduct = new Map<number, Record<string, number>>();
  const thresholdByProduct = new Map<number, number>();
  for (const stock of inventoryResult.data ?? []) {
    const stockByWarehouse = stockByProduct.get(stock.product_id) ?? {};
    stockByWarehouse[stock.warehouse_id] = stock.quantity;
    stockByProduct.set(stock.product_id, stockByWarehouse);
    thresholdByProduct.set(stock.product_id, stock.low_stock_threshold);
  }

  const inventory: AdminStoreData["inventory"] = (productsResult.data ?? []).map((product) => ({
    productId: product.id,
    sku: product.sku,
    name: product.name,
    price: product.price_cents / 100,
    lowStockThreshold: thresholdByProduct.get(product.id) ?? 0,
    stockByWarehouse: stockByProduct.get(product.id) ?? {},
  }));

  const orders: AdminOrder[] = (ordersResult.data ?? []).map((order) => ({
    id: order.order_number,
    customer: order.customer_name,
    email: order.customer_email,
    date: order.created_at,
    total: order.total_cents / 100,
    status: displayOrderStatus(order.status),
    items: (order.order_items ?? []).map(
      (item) => `${item.product_name} × ${item.quantity}`,
    ),
    trackingUpdates: (order.order_tracking_updates ?? [])
      .map((update) => ({
        status: update.status,
        location: update.location,
        note: update.note,
        createdAt: update.created_at,
      }))
      .sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
  }));

  const data: AdminStoreData = {
    warehouses: (warehousesResult.data ?? []).map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      location: warehouse.location,
    })),
    inventory,
    orders,
    discounts: (discountsResult.data ?? []).map((discount) => ({
      id: discount.id,
      name: discount.name,
      kind: discount.kind as DiscountKind,
      value: discount.value,
      ...(discount.code ? { code: discount.code } : {}),
      ...(discount.minimum_quantity ? { minimumQuantity: discount.minimum_quantity } : {}),
      active: discount.active,
    })),
  };

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
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
  if (
    !body ||
    typeof body !== "object" ||
    !("store" in body) ||
    !body.store ||
    typeof body.store !== "object"
  ) {
    return NextResponse.json({ error: "Invalid store update." }, { status: 400 });
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

  const { error } = await supabase.rpc("sync_admin_store", {
    p_store: body.store as Record<string, unknown>,
  });
  if (error) {
    console.error("Failed to save admin store data:", error);
    return NextResponse.json({ error: "Store changes could not be saved." }, { status: 400 });
  }

  return NextResponse.json({ saved: true });
}
