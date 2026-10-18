"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { changeCartQuantity, clearCart, getCart, getCartCount } from "@/lib/cart";
import { products } from "@/lib/products";

type PayWayCheckout = {
  action: string;
  fields: Record<string, string>;
};

const paymentOptions = [
  {
    value: "aba_payway",
    title: "ABA / KHQR",
    description: "Pay securely with ABA Pay or a KHQR-supported banking app.",
  },
  {
    value: "cash_on_delivery",
    title: "Cash on Delivery",
    description: "Pay in cash when your package arrives.",
  },
] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<number, number>>(() => getCart());
  const [paymentMethod, setPaymentMethod] = useState<(typeof paymentOptions)[number]["value"]>("aba_payway");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [payWayCheckout, setPayWayCheckout] = useState<PayWayCheckout | null>(null);
  const payWayFormRef = useRef<HTMLFormElement>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const cartItems = useMemo(
    () => products.filter((product) => (cart[product.id] || 0) > 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0),
    [cart, cartItems],
  );

  const shipping = cartItems.length > 0 ? 8 : 0;

  function handleQuantityChange(productId: number, amount: number) {
    const nextCart = changeCartQuantity(productId, amount);
    setCart(nextCart);
  }

  useEffect(() => {
    if (payWayCheckout && payWayFormRef.current) {
      payWayFormRef.current.submit();
    }
  }, [payWayCheckout]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      idempotencyKeyRef.current ??= crypto.randomUUID();
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyKeyRef.current,
          paymentMethod,
          items: cartItems.map((product) => ({
            productId: product.id,
            quantity: cart[product.id],
          })),
          address: {
            name: formData.get("name"),
            phone: formData.get("phone"),
            line1: formData.get("line1"),
            line2: formData.get("line2"),
            city: formData.get("city"),
            postalCode: formData.get("postalCode"),
            country: formData.get("country"),
            notes: formData.get("notes"),
          },
        }),
      });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object") {
        throw new Error("The order service returned an invalid response.");
      }

      const resultData = result as {
        error?: unknown;
        orderNumber?: unknown;
        checkout?: unknown;
      };
      if (!response.ok) {
        const message =
          typeof resultData.error === "string"
            ? resultData.error
            : "We could not place your order. Please try again.";
        throw new Error(message);
      }
      if (typeof resultData.orderNumber !== "string") {
        throw new Error("The order service did not return an order number.");
      }

      if (paymentMethod === "cash_on_delivery") {
        clearCart();
        setCart({});
        router.push(`/confirmation?order=${encodeURIComponent(resultData.orderNumber)}`);
        return;
      }

      if (
        !resultData.checkout ||
        typeof resultData.checkout !== "object" ||
        !("action" in resultData.checkout) ||
        !("fields" in resultData.checkout)
      ) {
        throw new Error("The order was saved, but payment could not be started. Contact support with your order number.");
      }
      setPayWayCheckout(resultData.checkout as PayWayCheckout);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "We could not place your order. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="checkout-shell section-pad">
      <div className="checkout-header">
        <Link href="/" className="brand" aria-label="Floralyn Skin home">
          <span className="brand-mark">✳</span>
          <span>
            FLORALYN
            <small>BOTANICAL SKINCARE</small>
          </span>
        </Link>
        <span className="checkout-step">Checkout · {getCartCount(cart)} items</span>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-state-card checkout-empty">
          <span className="story-flower">✳</span>
          <h1>Your bag is empty.</h1>
          <p>Choose a few skin-loving essentials to build your routine.</p>
          <Link href="/" className="button button-dark">Shop the collection</Link>
        </div>
      ) : (
        <div className="checkout-layout">
          <form className="checkout-form" onSubmit={handleSubmit}>
            <div className="form-section-block">
              <h2>Delivery details</h2>
              <div className="form-row">
                <label>
                  Full name
                  <input type="text" name="name" autoComplete="name" required maxLength={120} />
                </label>
              </div>
              <div className="form-row two-up">
                <label>
                  Phone
                  <input type="tel" name="phone" autoComplete="tel" required maxLength={24} />
                </label>
                <label>
                  Country
                  <input type="text" name="country" autoComplete="country-name" defaultValue="Cambodia" required maxLength={100} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Address
                  <input type="text" name="line1" autoComplete="address-line1" required maxLength={200} />
                </label>
                <label>
                  Apartment, suite, etc. (optional)
                  <input type="text" name="line2" autoComplete="address-line2" maxLength={200} />
                </label>
              </div>
              <div className="form-row two-up">
                <label>
                  City
                  <input type="text" name="city" autoComplete="address-level2" required maxLength={100} />
                </label>
                <label>
                  Postal code
                  <input type="text" name="postalCode" autoComplete="postal-code" maxLength={32} />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Delivery notes
                  <textarea name="notes" rows={4} maxLength={1000} />
                </label>
              </div>
            </div>

            <div className="form-section-block">
              <div className="payment-card">
                <div>
                  <div className="mini-label">Payment method</div>
                  <h3>{paymentOptions.find((option) => option.value === paymentMethod)?.title}</h3>
                </div>
                <button type="button" className="button button-ghost" onClick={() => setIsModalOpen(true)}>
                  Select payment
                </button>
              </div>
            </div>

            {submitError && <p className="auth-alert error" role="alert">{submitError}</p>}
            <button type="submit" className="button button-dark checkout-submit" disabled={isSubmitting}>
              {isSubmitting ? "Preparing your order…" : "Place order"}
            </button>
          </form>

          <aside className="checkout-summary">
            <h2>Your order</h2>
            {cartItems.map((product) => (
              <div className="checkout-line" key={product.id}>
                <div className="checkout-item-meta">
                  <strong>{product.name}</strong>
                  <span>${product.price.toFixed(2)}</span>
                </div>
                <div className="quantity-control checkout-qty">
                  <button type="button" onClick={() => handleQuantityChange(product.id, -1)} aria-label={`Remove one ${product.name}`}>
                    −
                  </button>
                  <span>{cart[product.id]}</span>
                  <button type="button" onClick={() => handleQuantityChange(product.id, 1)} aria-label={`Add one ${product.name}`}>
                    +
                  </button>
                </div>
                <strong className="line-price">${(product.price * (cart[product.id] || 0)).toFixed(2)}</strong>
              </div>
            ))}

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <strong>${shipping.toFixed(2)}</strong>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <strong>${(subtotal + shipping).toFixed(2)}</strong>
            </div>
          </aside>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="eyebrow">PAYMENT</div>
                <h3>Select a method</h3>
              </div>
              <button type="button" className="close-button" onClick={() => setIsModalOpen(false)} aria-label="Close payment selector">
                ×
              </button>
            </div>

            <div className="payment-list">
              {paymentOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={paymentMethod === option.value ? "payment-option active" : "payment-option"}
                  onClick={() => {
                    setPaymentMethod(option.value);
                    setIsModalOpen(false);
                  }}
                >
                  <div>
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </div>
                  <span>{paymentMethod === option.value ? "Selected" : "Choose"}</span>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

      {payWayCheckout && (
        <form
          ref={payWayFormRef}
          action={payWayCheckout.action}
          method="POST"
          className="payway-redirect-form"
          aria-label="Redirecting to ABA PayWay"
        >
          {Object.entries(payWayCheckout.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <p>Redirecting securely to ABA PayWay…</p>
          <button type="submit" className="button button-dark">Continue to payment</button>
        </form>
      )}
    </main>
  );
}
