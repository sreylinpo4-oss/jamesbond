"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ConfirmationDetails() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order") ?? "FL-2407";
  const paymentMethod = searchParams.get("method") ?? "ABA / KHQR";
  const total = searchParams.get("total") ?? "0.00";

  return (
    <div className="confirmation-card">
      <span className="story-flower">✳</span>
      <div className="eyebrow">ORDER CONFIRMED</div>
      <h1>Thank you for your demo order.</h1>
      <p className="confirmation-summary">
        Your order <strong>{orderNumber}</strong> has been placed in this demo storefront.
        This experience does not process real card, bank, or mobile payments.
      </p>

      <div className="confirmation-box">
        <div className="summary-row">
          <span>Payment method</span>
          <strong>{paymentMethod}</strong>
        </div>
        <div className="summary-row">
          <span>Order total</span>
          <strong>${total}</strong>
        </div>
        <div className="summary-row">
          <span>Delivery</span>
          <strong>Demo delivery</strong>
        </div>
      </div>

      <p className="demo-note compact-note">
        Demo notice: no real transaction or payment was charged. This is not a successful online payment.
      </p>

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
      <Suspense fallback={<div className="confirmation-card"><span className="story-flower">✳</span><div className="eyebrow">ORDER CONFIRMED</div><h1>Loading your order…</h1></div>}>
        <ConfirmationDetails />
      </Suspense>
    </main>
  );
}
