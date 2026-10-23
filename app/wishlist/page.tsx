"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import BrandMark from "@/components/BrandMark";
import { addToCart } from "@/lib/cart";
import { products } from "@/lib/products";
import { toggleWishlist, useWishlist } from "@/lib/wishlist";

export default function WishlistPage() {
  const favoriteIds = useWishlist();

  const savedProducts = useMemo(
    () => products.filter((product) => favoriteIds.includes(product.id)),
    [favoriteIds],
  );

  function handleToggle(productId: number) {
    toggleWishlist(productId);
  }

  function handleAddToCart(productId: number) {
    addToCart(productId);
  }

  return (
    <main className="page-shell static-page">
      <header className="detail-header">
        <Link href="/" className="brand" aria-label="Floralyn Skin home">
          <BrandMark />
          <span>
            FLORALYN
            <small>BOTANICAL SKINCARE</small>
          </span>
        </Link>
        <div className="detail-actions-inline">
          <Link href="/cart" className="text-link">Bag</Link>
          <Link href="/account" className="text-link">Account</Link>
        </div>
      </header>

      <div className="page-header-row">
        <div>
          <div className="eyebrow">SAVED FOR LATER</div>
          <h1>Your wishlist.</h1>
        </div>
        <Link href="/" className="text-link">Back to shop ↗</Link>
      </div>

      {savedProducts.length === 0 ? (
        <div className="empty-state-card">
          <BrandMark className="story-flower" size={140} />
          <h2>No favorites yet.</h2>
          <p>Save the products that feel like your perfect ritual.</p>
          <Link href="/" className="button button-dark">Browse products</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {savedProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <Link href={`/product/${product.id}`} className="product-image-wrap product-tone-0">
                <Image src={product.image} alt={product.name} width={800} height={960} />
                <span className="product-tag">{product.tag}</span>
              </Link>
              <div className="product-info">
                <div>
                  <span className="product-category">{product.category}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
              </div>
              <div className="product-card-actions">
                <button type="button" className="add-button" onClick={() => handleAddToCart(product.id)}>
                  Add to bag <span>↗</span>
                </button>
                <button type="button" className="text-link product-link" onClick={() => handleToggle(product.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
