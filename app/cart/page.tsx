"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import BrandMark from "@/components/BrandMark";
import { changeCartQuantity, clearCart, getCartCount, useCart } from "@/lib/cart";
import { saveAppliedPromo, useAppliedPromo } from "@/lib/discounts";
import { mergeCatalog, products, type Product } from "@/lib/products";

export default function CartPage() {
  const cart = useCart();
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const appliedPromo = useAppliedPromo();

  useEffect(() => {
    let isMounted = true;
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.products) && data.products.length > 0) {
          setCatalog(mergeCatalog(data.products));
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const cartItems = useMemo(
    () => catalog.filter((product) => (cart[product.id] || 0) > 0),
    [catalog, cart],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0),
    [cart, cartItems],
  );

  const discountDollars = (appliedPromo?.discountCents ?? 0) / 100;
  const shipping = cartItems.length > 0 ? 8 : 0;
  const total = Math.max(0, subtotal - discountDollars + shipping);

  // Re-verify promo when subtotal/items change
  const appliedCode = appliedPromo?.code;
  useEffect(() => {
    if (!appliedCode) return;
    const subtotalCents = Math.round(subtotal * 100);
    const totalCount = getCartCount(cart);

    fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: appliedCode,
        subtotalCents,
        itemCount: totalCount,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.valid) {
          saveAppliedPromo({
            code: data.code,
            name: data.name,
            discountCents: data.discount_cents,
            message: data.message,
          });
        } else if (data?.requirementNotMet || data?.requirement_not_met) {
          saveAppliedPromo({
            code: appliedCode,
            name: appliedPromo?.name || appliedCode,
            discountCents: 0,
            message: data.message,
          });
        } else if (totalCount > 0) {
          saveAppliedPromo(null);
        }
      })
      .catch(() => {});
  }, [subtotal, cart, appliedCode, appliedPromo?.name]);

  async function handleApplyPromo(event: FormEvent) {
    event.preventDefault();
    if (!promoInput.trim()) return;

    setPromoLoading(true);
    setPromoError("");
    setPromoSuccess("");

    try {
      const subtotalCents = Math.round(subtotal * 100);
      const totalCount = getCartCount(cart);
      const response = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoInput.trim(),
          subtotalCents,
          itemCount: totalCount,
        }),
      });

      const data = await response.json();
      if (data?.valid) {
        const promo = {
          code: data.code,
          name: data.name,
          discountCents: data.discount_cents,
          message: data.message,
        };
        saveAppliedPromo(promo);
        setPromoSuccess(data.message || "Promo applied successfully!");
        setPromoInput("");
      } else {
        setPromoError(data?.message || "Invalid promo code.");
      }
    } catch {
      setPromoError("Unable to validate promo code. Please try again.");
    } finally {
      setPromoLoading(false);
    }
  }

  function handleRemovePromo() {
    saveAppliedPromo(null);
    setPromoSuccess("");
    setPromoError("");
  }

  function handleQuantityChange(productId: number, amount: number) {
    changeCartQuantity(productId, amount);
  }

  function handleClearCart() {
    clearCart();
    handleRemovePromo();
  }

  return (
    <main className="page-shell static-page cart-page">
      <header className="detail-header">
        <Link href="/" className="brand" aria-label="Floralyn Skin home">
          <BrandMark />
          <span>
            FLORALYN
            <small>BOTANICAL SKINCARE</small>
          </span>
        </Link>
        <div className="detail-actions-inline">
          <Link href="/wishlist" className="text-link">Wishlist</Link>
          <Link href="/account" className="text-link">Account</Link>
        </div>
      </header>

      <div className="page-header-row">
        <div>
          <div className="eyebrow">YOUR BAG</div>
          <h1>Curated for your ritual.</h1>
        </div>
        <Link href="/" className="text-link">Continue shopping ↗</Link>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-state-card cart-empty-card">
          <BrandMark className="story-flower" size={140} />
          <h2>Your bag is empty.</h2>
          <p>Pick a few essentials and let your routine bloom.</p>
          <Link href="/" className="button button-dark">Shop the collection</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-list-panel">
            {cartItems.map((product) => (
              <article className="cart-line-item" key={product.id}>
                <div className="cart-thumb-wrap">
                  <Image src={product.image} alt={product.name} width={220} height={260} />
                </div>
                <div className="cart-item-copy">
                  <span className="mini-label">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <strong>${product.price.toFixed(2)}</strong>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-control">
                    <button type="button" onClick={() => handleQuantityChange(product.id, -1)} aria-label={`Remove one ${product.name}`}>
                      −
                    </button>
                    <span>{cart[product.id]}</span>
                    <button type="button" onClick={() => handleQuantityChange(product.id, 1)} aria-label={`Add one ${product.name}`}>
                      +
                    </button>
                  </div>
                  <div className="line-total">${(product.price * (cart[product.id] || 0)).toFixed(2)}</div>
                </div>
              </article>
            ))}

            <button type="button" className="text-link clear-bag" onClick={handleClearCart}>Clear bag</button>
          </section>

          <aside className="summary-panel">
            <div className="summary-title">Order summary</div>

            <div className="checkout-promo-box cart-promo-box">
              {appliedPromo ? (
                <div className="promo-applied-tag">
                  <div className="promo-info">
                    <span className="promo-sparkle">•</span>
                    <div>
                      <strong>{appliedPromo.code}</strong>
                      <small>{appliedPromo.name}</small>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="promo-remove-btn"
                    onClick={handleRemovePromo}
                    aria-label="Remove promo code"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <form className="promo-input-form" onSubmit={handleApplyPromo}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo or coupon code"
                    className="promo-input"
                    maxLength={30}
                  />
                  <button
                    type="submit"
                    className="button button-ghost promo-apply-btn"
                    disabled={promoLoading || !promoInput.trim()}
                  >
                    {promoLoading ? "Applying…" : "Apply"}
                  </button>
                </form>
              )}
              {promoError && <p className="promo-feedback error">{promoError}</p>}
              {promoSuccess && !promoError && <p className="promo-feedback success">{promoSuccess}</p>}
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <strong>${subtotal.toFixed(2)}</strong>
            </div>
            {discountDollars > 0 && (
              <div className="summary-row discount-row">
                <span>Discount ({appliedPromo?.code})</span>
                <strong className="discount-amount">−${discountDollars.toFixed(2)}</strong>
              </div>
            )}
            <div className="summary-row">
              <span>Shipping</span>
              <strong>${shipping.toFixed(2)}</strong>
            </div>
            <div className="summary-row total-row">
              <span>Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <Link href="/checkout" className="button button-dark checkout-button">Proceed to checkout</Link>
            <p className="demo-note compact-note">Demo storefront only. No payment is charged.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
