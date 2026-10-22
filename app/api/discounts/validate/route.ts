import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const FALLBACK_DISCOUNTS: Record<
  string,
  { name: string; kind: string; value: string; minQuantity?: number }
> = {
  BLOOM10: { name: "Flora VIP 10% Off", kind: "Coupon", value: "10%", minQuantity: 1 },
  WELCOME10: { name: "Welcome 10% Off", kind: "Coupon", value: "10%", minQuantity: 1 },
  GLOW15: { name: "Glow Ritual 15% Off", kind: "Coupon", value: "15%", minQuantity: 2 },
  FLORAL5: { name: "$5 Off First Order", kind: "Coupon", value: "$5.00", minQuantity: 1 },
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const requestOrigin = new URL(request.url).origin;
      const forwardedHost = request.headers.get("x-forwarded-host");
      const host = request.headers.get("host");
      const originHost = new URL(origin).host;
      const isAllowed =
        origin === requestOrigin ||
        (forwardedHost && originHost === forwardedHost) ||
        (host && originHost === host);
      if (!isAllowed) {
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
      }
    } catch {
      // ignore URL parsing error
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid discount details." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const code = typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  const subtotalCents = Number.isSafeInteger(input.subtotalCents) && Number(input.subtotalCents) >= 0
    ? Number(input.subtotalCents)
    : 0;
  const itemCount = Number.isSafeInteger(input.itemCount) && Number(input.itemCount) >= 0
    ? Number(input.itemCount)
    : 0;

  if (!code) {
    return NextResponse.json({ valid: false, message: "Please enter a promo code." });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    Boolean(supabaseUrl && supabaseAnonKey) &&
    !supabaseUrl?.includes("placeholder") &&
    !supabaseUrl?.includes("your-project-ref");

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("validate_discount_code", {
        p_code: code,
        p_subtotal_cents: subtotalCents,
        p_item_count: itemCount,
      });

      if (!error && data && typeof data === "object") {
        return NextResponse.json(data);
      }
    } catch (err) {
      console.warn("Database discount validation unavailable, checking fallback codes:", err);
    }
  }

  // Fallback in-memory validation when database function isn't yet migrated or offline
  const fallback = FALLBACK_DISCOUNTS[code];
  if (!fallback) {
    return NextResponse.json({
      valid: false,
      message: "Promo code is invalid or has expired.",
    });
  }

  if (itemCount === 0) {
    return NextResponse.json({
      valid: true,
      code,
      name: fallback.name,
      kind: fallback.kind,
      value: fallback.value,
      discount_cents: 0,
      message: `${fallback.name} applied! Discount will calculate when items are in your bag.`,
    });
  }

  if (fallback.minQuantity && itemCount < fallback.minQuantity) {
    return NextResponse.json({
      valid: false,
      requirementNotMet: true,
      message: `This code requires at least ${fallback.minQuantity} item(s) in your bag.`,
    });
  }

  let discountCents = 0;
  if (fallback.value.endsWith("%")) {
    const percent = parseFloat(fallback.value.slice(0, -1));
    discountCents = Math.round((subtotalCents * percent) / 100);
  } else {
    const dollars = parseFloat(fallback.value.replace(/[^0-9.]/g, ""));
    discountCents = Math.round(dollars * 100);
  }

  discountCents = Math.min(subtotalCents, Math.max(0, discountCents));

  return NextResponse.json({
    valid: true,
    code,
    name: fallback.name,
    kind: fallback.kind,
    value: fallback.value,
    discount_cents: discountCents,
    message: `${fallback.name} applied (-$${(discountCents / 100).toFixed(2)})`,
  });
}
