"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, use, useEffect, useMemo, useState } from "react";

import BrandMark from "@/components/BrandMark";
import { addToCart, getCartCount, useCart } from "@/lib/cart";
import { mergeCatalog, products, type Product } from "@/lib/products";
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
  const [catalog, setCatalog] = useState<Product[]>(products);
  const cart = useCart();
  const cartCount = getCartCount(cart);
  const wishlist = useWishlist();

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

  const product = useMemo(
    () => catalog.find((item) => item.id === productId),
    [catalog, productId],
  );

  if (!product) {
    return (
      <main className="product-shell empty-state-shell">
        <div className="empty-state-card">
          <BrandMark className="story-flower" size={140} />
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
  const [addedNotice, setAddedNotice] = useState(false);

  function handleAddToCart() {
    addToCart(currentProduct.id);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2200);
  }

  return (
    <main className="product-shell">
      <header className="detail-header">
        <Link href="/" className="brand" aria-label="Floralyn Skin home">
          <BrandMark />
          <span>
            FLORALYN
            <small>BOTANICAL SKINCARE</small>
          </span>
        </Link>
        <Link href="/cart" className="bag-button detail-bag-button">
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
          <div className="eyebrow">
            {product.brand ? `${product.brand} · ${product.category}` : product.category}
          </div>
          <h1>{product.name}</h1>
          {product.role && (
            <div className="product-role-tag" style={{ display: "inline-block", margin: "6px 0 12px" }}>
              Role & Function: {product.role}
            </div>
          )}
          <p className="detail-price">${product.price.toFixed(2)}</p>
          <p className="detail-description">{product.detail}</p>

          <div className="detail-actions">
            <button
              className={`button button-dark ${addedNotice ? "button-success" : ""}`}
              onClick={handleAddToCart}
            >
              {addedNotice ? "Added to bag!" : "Add to bag"} <span>↗</span>
            </button>
            <button
              type="button"
              className="button button-ghost"
              aria-pressed={wishlist.includes(product.id)}
              onClick={() => toggleWishlist(product.id)}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={wishlist.includes(product.id) ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
                style={{ display: "inline-block", verticalAlign: "middle", marginRight: "6px" }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
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
          {catalog
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
