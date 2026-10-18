import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";

  if (!configuredSecret) {
    return NextResponse.json({ error: "Order cleanup is not configured." }, { status: 503 });
  }

  const providedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const provided = Buffer.from(providedSecret);
  const expected = Buffer.from(configuredSecret);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("expire_unpaid_store_orders");
  if (error) {
    console.error("Failed to expire unpaid orders:", error);
    return NextResponse.json({ error: "Unable to expire unpaid orders." }, { status: 500 });
  }

  return NextResponse.json({ expiredOrders: data });
}
