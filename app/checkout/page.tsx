"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { changeCartQuantity, clearCart, getCart, getCartCount } from "@/lib/cart";
import { products } from "@/lib/products";

const paymentOptions = [
  {
    value: "ABA / KHQR",
    title: "ABA / KHQR",
    description: "Bank transfer or QR payment in a live store. Demo mode only.",
  },
  {
    value: "Cash on Delivery",
    title: "Cash on Delivery",
    description: "Pay in cash when your package arrives. Demo mode only.",
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Record<number, number>>(() => getCart());
  const [paymentMethod, setPaymentMethod] = useState("ABA / KHQR");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cartItems = useMemo(
    () => products.filter((product) => (cart[product.id] || 0) > 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0),
    [cart, cartItems],
  );

  const shipping = cartItems.length > 0 ? 8 : 0;
  const total = subtotal + shipping;

  function handleQuantityChange(productId: number, amount: number) {
    const nextCart = changeCartQuantity(productId, amount);
    setCart(nextCart);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const orderNumber = `FL-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    clearCart();
    setCart({});
    router.push(
      `/confirmation?order=${orderNumber}&method=${encodeURIComponent(paymentMethod)}&total=${total.toFixed(2)}`,
    );
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
            <div className="demo-banner">
              Demo checkout only — this storefront does not process real payments. No payment is charged.
            </div>

            <div className="form-section-block">
              <h2>Delivery details</h2>
              <div className="form-row">
                <label>
                  Full name
                  <input type="text" defaultValue="Nadia Smith" required />
                </label>
              </div>
              <div className="form-row two-up">
                <label>
                  Email
                  <input type="email" defaultValue="nadiasmith@example.com" required />
                </label>
                <label>
                  Phone
                  <input type="tel" defaultValue="(555) 012-3456" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Address
                  <input type="text" defaultValue="16 Lotus Lane" required />
                </label>
              </div>
              <div className="form-row two-up">
                <label>
                  City
                  <input type="text" defaultValue="Phnom Penh" required />
                </label>
                <label>
                  ZIP
                  <input type="text" defaultValue="12000" required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Delivery notes
                  <textarea rows={4} defaultValue="Please leave the parcel at the front desk if I am not home." />
                </label>
              </div>
            </div>

            <div className="form-section-block">
              <div className="payment-card">
                <div>
                  <div className="mini-label">Payment method</div>
                  <h3>{paymentMethod}</h3>
                </div>
                <button type="button" className="button button-ghost" onClick={() => setIsModalOpen(true)}>
                  Select payment
                </button>
              </div>
            </div>

            <button type="submit" className="button button-dark checkout-submit">
              Confirm demo order
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
              <strong>${total.toFixed(2)}</strong>
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

            <p className="demo-note compact-note">
              This is a demo-only interface. No real payment is processed or authorized here.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
