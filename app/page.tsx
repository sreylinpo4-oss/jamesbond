
"use client";

import { useMemo, useState } from "react";

const products = [
  {
    id: 1,
    name: "Gentle Facial Cleanser",
    category: "Cleanser",
    price: 12,
    image:
      "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=600",
    description: "A gentle daily cleanse for fresh, soft skin.",
  },
  {
    id: 2,
    name: "Hydrating Glow Serum",
    category: "Serum",
    price: 18,
    image:
      "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600",
    description: "Lightweight hydration for a healthy-looking glow.",
  },
  {
    id: 3,
    name: "Daily Moisturizer",
    category: "Moisturizer",
    price: 15,
    image:
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600",
    description: "Comforting moisture for your everyday routine.",
  },
  {
    id: 4,
    name: "Rose Skin Cream",
    category: "Moisturizer",
    price: 20,
    image:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600",
    description: "A silky cream for a soft, nourished feeling.",
  },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ [id: number]: number }>({});
  const [notice, setNotice] = useState("");

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = products.reduce(
    (sum, product) => sum + product.price * (cart[product.id] || 0),
    0
  );

  function addToCart(id: number) {
    setCart((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
    setNotice("Added to your bag ♡");
    setTimeout(() => setNotice(""), 2000);
  }

  return (
    <main>
      <div className="announcement">
        A little care, a lot of glow ✿ Welcome to Floralyn Skin
      </div>

      <header className="navbar">
        <a href="#" className="logo">✿ Floralyn Skin</a>
        <nav>
          <a href="#home">Home</a>
          <a href="#shop">Shop</a>
          <a href="#about">Our Story</a>
        </nav>
        <a className="bag" href="#cart">
          ♡ Bag ({cartCount})
        </a>
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <span className="eyebrow">YOUR DAILY SKINCARE RITUAL</span>
          <h1>Your skin,<br />your softest glow.</h1>
          <p>
            Thoughtful skincare for everyday moments.
            Discover your new favourites and let your natural
            beauty bloom.
          </p>
          <a className="primary-button" href="#shop">
            Shop the collection →
          </a>
          <div className="hero-note">Gentle care · Everyday glow · Made for you</div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1000"
            alt="Skincare products"
          />
          <div className="image-caption">
            <span>YOUR MOMENT OF SELF-CARE</span>
            <strong>Bloom in your own way.</strong>
          </div>
        </div>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THE COLLECTION</span>
            <h2>Find your daily ritual</h2>
            <p>Little essentials. Lovely skin days.</p>
          </div>
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search skincare..."
              aria-label="Search products"
            />
          </div>
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                <span className="product-tag">FLORALYN FAVOURITE</span>
              </div>
              <div className="product-info">
                <span className="category">{product.category}</span>
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <div className="product-bottom">
                  <strong>${product.price.toFixed(2)}</strong>
                  <button onClick={() => addToCart(product.id)}>
                    + Add to bag
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="empty">No products found. Try another search.</p>
        )}
      </section>

      <section className="story" id="about">
        <span className="eyebrow">A LITTLE ABOUT US</span>
        <h2>Care that feels like you.</h2>
        <p>
          Floralyn Skin is all about making everyday skincare
          feel simple, gentle, and special. Take a breath,
          slow down, and make a little time for yourself.
        </p>
        <a href="#shop" className="story-link">Explore our collection →</a>
      </section>

      <section className="cart-section" id="cart">
        <span className="eyebrow">YOUR SELECTION</span>
        <h2>Your shopping bag ♡</h2>

        {cartCount === 0 ? (
          <p>Your bag is waiting for something lovely.</p>
        ) : (
          <>
            {products
              .filter((product) => cart[product.id])
              .map((product) => (
                <div className="cart-row" key={product.id}>
                  <span>{product.name}</span>
                  <div className="quantity">
                    <button
                      aria-label={`Remove one ${product.name}`}
                      onClick={() =>
                        setCart((current) => ({
                          ...current,
                          [product.id]: Math.max(
                            0,
                            (current[product.id] || 0) - 1
                          ),
                        }))
                      }
                    >
                      −
                    </button>
                    <span>{cart[product.id]}</span>
                    <button onClick={() => addToCart(product.id)}>+</button>
                  </div>
                  <strong>
                    ${(product.price * cart[product.id]).toFixed(2)}
                  </strong>
                </div>
              ))}
            <div className="cart-total">
              <span>Subtotal</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <p className="cart-note">
              Delivery fees and final payment will be confirmed at checkout.
            </p>
            <button
              className="primary-button checkout-button"
              onClick={() =>
                setNotice(
                  "Checkout demo only. Real order and payment processing are not connected yet."
                )
              }
            >
              Proceed to checkout →
            </button>
          </>
        )}

        {notice && <p className="notice" role="status">{notice}</p>}
      </section>

      <footer>
        <a href="#home" className="logo">✿ Floralyn Skin</a>
        <p>A little care, a lot of glow.</p>
        <small>© {new Date().getFullYear()} Floralyn Skin. All rights reserved.</small>
      </footer>
    </main>
  );
}
