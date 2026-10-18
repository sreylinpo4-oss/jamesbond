import { NextResponse } from "next/server";

import { checkPayWayTransaction } from "@/lib/payway";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid callback body." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid callback body." }, { status: 400 });
  }

  const transactionId = (payload as Record<string, unknown>).tran_id;
  if (typeof transactionId !== "string" || !/^FL-[A-F0-9]{12}$/.test(transactionId)) {
    return NextResponse.json({ error: "Invalid transaction identifier." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,total_cents,payment_method")
    .eq("payment_transaction_id", transactionId)
    .maybeSingle();

  if (orderError) {
    console.error("Failed to locate PayWay order:", orderError);
    return NextResponse.json({ error: "Unable to locate order." }, { status: 500 });
  }
  if (!order || order.payment_method !== "aba_payway") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  try {
    const verified = await checkPayWayTransaction(transactionId);
    const isAmountMatch = verified.totalCents === order.total_cents;
    const paymentStatus =
      verified.status === "APPROVED" && !isAmountMatch
        ? "DECLINED"
        : verified.status;
    const { data: finalized, error: finalizeError } = await supabase.rpc(
      "finalize_payway_order",
      {
        p_transaction_id: transactionId,
        p_gateway_status: paymentStatus,
        p_paid_cents: verified.totalCents,
        p_payment_reference: verified.reference,
      },
    );

    if (finalizeError) {
      console.error("Failed to update verified PayWay order:", finalizeError);
      return NextResponse.json({ error: "Unable to update order payment." }, { status: 500 });
    }

    return NextResponse.json({ received: true, paid: finalized === true });
  } catch (error) {
    console.error("PayWay callback verification failed:", error);
    return NextResponse.json({ error: "Payment verification failed." }, { status: 502 });
  }
}
