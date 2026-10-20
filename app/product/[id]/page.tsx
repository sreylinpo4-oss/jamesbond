"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, use, useMemo } from "react";

import { addToCart, getCartCount, useCart } from "@/lib/cart";
import { getProductById, products } from "@/lib/products";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<main className="product-shell" aria-busy="true" />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

function ProductDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = Number(id);
  const product = useMemo(() => getProductById(productId), [productId]);
  const cart = useCart();
  const cartCount = getCartCount(cart);
  const wishlist = useWishlist();

  if (!product) {
    return (
      <main className="product-shell empty-state-shell">
        <div className="empty-state-card">
          <span className="story-flower">✳</span>
          <h1>Product not found.</h1>
          <p>This ritual isn&apos;t in our collection yet.</p>
          <Link href="/" className="button button-dark">
            Back to shop
          </Link>
        </div>
      </main>
    );
  }

  const currentProduct = product;

  function handleAddToCart() {
    addToCart(currentProduct.id);
  }

  return (
    <main className="product-shell">
      <header className="detail-header">
        <Link href="/" className="brand" aria-label="Floralyn Skin home">
          <span className="brand-mark">✳</span>
          <span>
            FLORALYN
            <small>BOTANICAL SKINCARE</small>
          </span>
        </Link>
        <Link href="/checkout" className="bag-button detail-bag-button">
          Bag <span className="bag-count">{cartCount}</span>
        </Link>
      </header>

      <section className="product-detail">
        <div className="detail-image-wrap">
          <Image
            src={product.image}
            alt={product.name}
            width={800}
            height={980}
            className="detail-image"
            priority
          />
          <span className="product-tag detail-tag">{product.tag}</span>
        </div>

        <div className="detail-copy">
          <div className="eyebrow">{product.category}</div>
          <h1>{product.name}</h1>
          <p className="detail-price">${product.price.toFixed(2)}</p>
          <p className="detail-description">{product.detail}</p>

          <div className="detail-actions">
            <button className="button button-dark" onClick={handleAddToCart}>
              Add to bag <span>↗</span>
            </button>
            <button
              type="button"
              className="button button-ghost"
              aria-pressed={wishlist.includes(product.id)}
              onClick={() => toggleWishlist(product.id)}
            >
              <span aria-hidden="true">
                {wishlist.includes(product.id) ? "♥" : "♡"}
              </span>
              {wishlist.includes(product.id)
                ? "Saved to wishlist"
                : "Save to wishlist"}
            </button>
            <Link href="/" className="text-link">
              Continue shopping ↗
            </Link>
          </div>

          <ul className="benefit-list">
            {product.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="related-section section-pad">
        <div className="section-heading">
          <div>
            <div className="eyebrow">PAIR WITH</div>
            <h2>Complete your ritual.</h2>
          </div>
        </div>
        <div className="product-grid related-grid">
          {products
            .filter((item) => item.id !== product.id)
            .slice(0, 3)
            .map((item) => (
              <article className="product-card" key={item.id}>
                <Link href={`/product/${item.id}`} className="product-image-wrap product-tone-0">
                  <Image src={item.image} alt={item.name} width={800} height={960} />
                  <span className="product-tag">{item.tag}</span>
                </Link>
                <div className="product-info">
                  <div>
                    <span className="product-category">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <strong className="product-price">${item.price.toFixed(2)}</strong>
                </div>
                <Link className="add-button" href={`/product/${item.id}`}>
                  View product <span>↗</span>
                </Link>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
}
