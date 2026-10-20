"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { changeCartQuantity, clearCart, useCart } from "@/lib/cart";
import { products } from "@/lib/products";

export default function CartPage() {
  const cart = useCart();

  const cartItems = useMemo(
    () => products.filter((product) => (cart[product.id] || 0) > 0),
    [cart],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((total, product) => total + product.price * (cart[product.id] || 0), 0),
    [cart, cartItems],
  );

  const shipping = cartItems.length > 0 ? 12 : 0;
  const total = subtotal + shipping;

  function handleQuantityChange(productId: number, amount: number) {
    changeCartQuantity(productId, amount);
  }

  function handleClearCart() {
    clearCart();
  }

  return (
    <main className="page-shell static-page cart-page">
      <header className="detail-header">
        <Link href="/" className="brand" aria-label="Floralyn Skin home">
          <span className="brand-mark">✳</span>
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
          <span className="story-flower">✳</span>
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
            <Link href="/checkout" className="button button-dark checkout-button">Proceed to checkout</Link>
            <p className="demo-note compact-note">Demo storefront only. No payment is charged.</p>
          </aside>
        </div>
      )}
    </main>
  );
}
