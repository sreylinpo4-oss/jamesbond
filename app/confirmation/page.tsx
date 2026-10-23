"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import BrandMark from "@/components/BrandMark";
import { clearCart } from "@/lib/cart";

type OrderDetails = {
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  discount_cents?: number;
  discount_code?: string | null;
  total_cents: number;
  order_items: {
    product_name: string;
    quantity: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[];
};

function ConfirmationDetails() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState(() =>
    orderNumber ? "" : "No order number was provided.",
  );
  const [isLoading, setIsLoading] = useState(Boolean(orderNumber));

  useEffect(() => {
    if (!orderNumber) return;
    const requestedOrderNumber = orderNumber;

    let isActive = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function loadOrder() {
      try {
        const response = await fetch(`/api/orders?order=${encodeURIComponent(requestedOrderNumber)}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.order) {
          throw new Error(result.error || "We could not load this order.");
        }
        if (!isActive) return;

        const currentOrder = result.order as OrderDetails;
        setOrder(currentOrder);
        setIsLoading(false);
        if (currentOrder.payment_status === "paid" || currentOrder.payment_status === "cod_due") {
          clearCart();
        } else if (currentOrder.payment_status === "pending" && attempts < 10) {
          attempts += 1;
          timer = setTimeout(loadOrder, 3000);
        }
      } catch (loadError) {
        if (!isActive) return;
        setError(
          loadError instanceof Error ? loadError.message : "We could not load this order.",
        );
        setIsLoading(false);
      }
    }

    void loadOrder();
    return () => {
      isActive = false;
      if (timer) clearTimeout(timer);
    };
  }, [orderNumber]);

  const isPaid = order?.payment_status === "paid";
  const isCod = order?.payment_status === "cod_due";
  const paymentLabel =
    order?.payment_method === "aba_payway" ? "ABA PayWay / KHQR" : "Cash on delivery";

  return (
    <div className="confirmation-card">
      <BrandMark className="story-flower" size={140} />
      <div className="eyebrow">
        {isLoading ? "LOADING ORDER" : isPaid ? "PAYMENT RECEIVED" : isCod ? "ORDER PLACED" : "PAYMENT STATUS"}
      </div>
      <h1>
        {isLoading
          ? "Loading your order…"
          : error
            ? "We couldn’t load this order."
            : isPaid
              ? "Thank you for your order."
              : isCod
                ? "Your order is on its way to our team."
                : order?.payment_status === "pending"
                  ? "We’re confirming your payment."
                  : "Payment wasn’t completed."}
      </h1>
      {error ? (
        <p className="confirmation-summary" role="alert">{error}</p>
      ) : order ? (
        <>
          <p className="confirmation-summary">
            Order <strong>{order.order_number}</strong>
            {isPaid
              ? " has been paid successfully."
              : isCod
                ? " has been placed. Please have payment ready when it arrives."
                : order.payment_status === "pending"
                  ? " is awaiting payment confirmation."
                  : " was not paid. You can return to the shop and try again."}
          </p>

          <div className="confirmation-box">
            <div className="summary-row">
              <span>Payment method</span>
              <strong>{paymentLabel}</strong>
            </div>
            <div className="summary-row">
              <span>Order status</span>
              <strong>{order.status}</strong>
            </div>
            {order.order_items.map((item) => (
              <div className="summary-row" key={`${order.order_number}-${item.product_name}`}>
                <span>{item.product_name} × {item.quantity}</span>
                <strong>{order.currency} {(item.line_total_cents / 100).toFixed(2)}</strong>
              </div>
            ))}
            {typeof order.discount_cents === "number" && order.discount_cents > 0 && (
              <div className="summary-row discount-row">
                <span>Discount {order.discount_code ? `(${order.discount_code})` : ""}</span>
                <strong className="discount-amount">−{order.currency} {(order.discount_cents / 100).toFixed(2)}</strong>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <strong>{order.currency} {(order.shipping_cents / 100).toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Total</span>
              <strong>{order.currency} {(order.total_cents / 100).toFixed(2)}</strong>
            </div>
          </div>
        </>
      ) : null}

      <div className="confirmation-actions">
        <Link href="/" className="button button-dark">Continue shopping</Link>
        <Link href="/account" className="text-link">View account ↗</Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <main className="page-shell static-page confirmation-shell">
      <Suspense fallback={<div className="confirmation-card"><BrandMark className="story-flower" size={140} /><div className="eyebrow">ORDER CONFIRMED</div><h1>Loading your order…</h1></div>}>
        <ConfirmationDetails />
      </Suspense>
    </main>
  );
}
