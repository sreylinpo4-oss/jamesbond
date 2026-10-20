"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { addToCart, changeCartQuantity, getCartCount, useCart } from "@/lib/cart";
import { categories, products, type Product } from "@/lib/products";

const ritualHighlights = [
    {
        icon: "✦",
        title: "Hydrate deeply",
        description: "Plump, cushion, and comfort skin with barrier-loving formulas.",
    },
    {
        icon: "❋",
        title: "Calm the day",
        description: "Soft botanicals help ease stress, redness, and afternoon fatigue.",
    },
    {
        icon: "✿",
        title: "Glow softly",
        description: "Build a routine that looks fresh, rested, and naturally luminous.",
    },
];

export default function Home() {
    const [category, setCategory] = useState("All");
    const [search, setSearch] = useState("");
    const cart = useCart();
    const [cartOpen, setCartOpen] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [notice, setNotice] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const previewPanelRef = useRef<HTMLElement>(null);
    const previewTriggerRef = useRef<HTMLAnchorElement>(null);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory =
                category === "All" || product.category === category;
            const matchesSearch =
                product.name.toLowerCase().includes(search.toLowerCase()) ||
                product.description.toLowerCase().includes(search.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }, [category, search]);

    const cartItems = products.filter((product) => (cart[product.id] || 0) > 0);
    const cartCount = getCartCount(cart);
    const subtotal = cartItems.reduce(
        (total, product) => total + product.price * (cart[product.id] || 0),
        0
    );

    function addToCartItem(product: Product) {
        addToCart(product.id);
        setNotice(`${product.name} added to your bag 🌿`);
        window.setTimeout(() => setNotice(""), 2500);
    }

    function changeQuantity(id: number, amount: number) {
        changeCartQuantity(id, amount);
    }

    function openProductPreview(event: MouseEvent<HTMLAnchorElement>, product: Product) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();
        previewTriggerRef.current = event.currentTarget;
        setPreviewProduct(product);
    }

    function closeProductPreview() {
        setPreviewProduct(null);
        previewTriggerRef.current?.focus();
    }

    useEffect(() => {
        if (!previewProduct) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        previewPanelRef.current?.focus();

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") closeProductPreview();
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [previewProduct]);

    function addPreviewProductToCart() {
        if (!previewProduct) return;
        addToCart(previewProduct.id);
        setNotice(`${previewProduct.name} added to your bag 🌿`);
    }

    return (
        <main>
            <div className="announcement">
                A little nature, a little luxury — enjoy 10% off your first order
                <span> · </span> Use code <strong> BLOOM10 </strong>
            </div>

            <header className="site-header">
                <Link href="#home" className="brand" aria-label="Floralyn Skin home">
                    <span className="brand-mark">✳</span>
                    <span>
                        FLORALYN
                        <small>BOTANICAL SKINCARE</small>
                    </span>
                </Link>

                <button
                    className="menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle navigation"
                >
                    {menuOpen ? "✕" : "☰"}
                </button>

                <nav className={menuOpen ? "nav-links nav-open" : "nav-links"}>
                    <Link href="#home" onClick={() => setMenuOpen(false)}>Home</Link>
                    <Link href="#shop" onClick={() => setMenuOpen(false)}>Shop</Link>
                    <Link href="#ritual" onClick={() => setMenuOpen(false)}>Our ritual</Link>
                    <Link href="/wishlist" onClick={() => setMenuOpen(false)}>Wishlist</Link>
                    <Link href="/account" onClick={() => setMenuOpen(false)}>Account</Link>
                    <Link href="/cart" onClick={() => setMenuOpen(false)}>Cart</Link>
                </nav>

                <div className="header-actions">
                    <button
                        className="icon-button"
                        onClick={() => {
                            document.getElementById("shop")?.scrollIntoView({
                                behavior: "smooth",
                            });
                            searchInputRef.current?.focus({ preventScroll: true });
                            setMenuOpen(false);
                        }}
                        aria-label="Search products"
                    >
                        ⌕
                    </button>
                    <button
                        className="bag-button"
                        onClick={() => setCartOpen(true)}
                        aria-label={`Shopping bag with ${cartCount} items`}
                    >
                        Bag <span className="bag-count">{cartCount}</span>
                    </button>
                </div>
            </header>

            <section className="hero" id="home">
                <div className="hero-copy">
                    <div className="eyebrow">
                        <span className="eyebrow-line" />
                        YOUR DAILY MOMENT OF CALM
                    </div>
                    <h1>
                        Let your skin
                        <br />
                        <em>bloom naturally.</em>
                    </h1>
                    <p className="hero-description">
                        Thoughtful skincare inspired by nature. Gentle rituals, botanical
                        ingredients, and a little everyday luxury for your skin.
                    </p>
                    <div className="hero-buttons">
                        <a className="button button-dark" href="#shop">
                            Discover your ritual <span>↗</span>
                        </a>
                        <a className="text-link" href="#story">
                            Our philosophy ↗
                        </a>
                    </div>
                    <div className="hero-note">
                        <span className="note-icon">✳</span>
                        <span>
                            <strong>Less, but more intentional.</strong>
                            <small>Skincare that feels like a deep breath.</small>
                        </span>
                    </div>
                    <span className="hero-decoration">grow gently · glow softly</span>
                </div>

                <div className="hero-visual">
                    <Image
                        className="hero-image"
                        src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=90"
                        alt="Elegant skincare products in a natural setting"
                        width={1200}
                        height={1200}
                        priority
                    />
                    <div className="hero-image-label">
                        <span className="label-flower">✿</span>
                        <span>
                            ROOTED IN NATURE
                            <small>Made for your everyday ritual</small>
                        </span>
                    </div>
                    <div className="floating-seal">
                        <span>YOUR SKIN</span>
                        <span className="seal-flower">✳</span>
                        <span>YOUR RITUAL</span>
                    </div>
                </div>
            </section>

            <section className="trust-strip">
                <div><span>✳</span> Nature-inspired care</div>
                <div><span>✳</span> Gentle daily rituals</div>
                <div><span>✳</span> Thoughtfully selected ingredients</div>
                <div><span>✳</span> A little luxury, every day</div>
            </section>

            <section className="ritual-spotlight section-pad">
                <div className="section-heading">
                    <div>
                        <div className="eyebrow">WHY IT FEELS GOOD</div>
                        <h2>Your ritual, made <em>gentle.</em></h2>
                    </div>
                    <a className="text-link" href="#shop">Build your routine ↗</a>
                </div>
                <div className="spotlight-grid">
                    {ritualHighlights.map((item) => (
                        <article className="spotlight-card" key={item.title}>
                            <span className="spotlight-icon">{item.icon}</span>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="shop-section section-pad" id="shop">
                <div className="section-heading">
                    <div>
                        <div className="eyebrow">THE FLORALYN COLLECTION</div>
                        <h2>Your skin&apos;s new <em>happy place.</em></h2>
                    </div>
                    <span className="collection-count">
                        {filteredProducts.length.toString().padStart(2, "0")} PRODUCTS
                    </span>
                </div>

                <div className="shop-controls">
                    <div className="category-tabs" role="group" aria-label="Filter by category">
                        {categories.map((item) => (
                            <button
                                key={item}
                                className={category === item ? "category-tab active" : "category-tab"}
                                onClick={() => setCategory(item)}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                    <label className="search-box">
                        <span>⌕</span>
                        <input
                            ref={searchInputRef}
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Find your favorite..."
                            aria-label="Search products"
                        />
                    </label>
                </div>

                {filteredProducts.length > 0 ? (
                    <div className="product-grid">
                        {filteredProducts.map((product, index) => (
                            <article className="product-card" key={product.id}>
                                <Link
                                    href={`/product/${product.id}`}
                                    className={`product-image-wrap product-tone-${index % 4}`}
                                    onClick={(event) => openProductPreview(event, product)}
                                    aria-haspopup="dialog"
                                >
                                    <Image src={product.image} alt={product.name} width={800} height={960} />
                                    <span className="product-tag">{product.tag}</span>
                                </Link>
                                <div className="product-info">
                                    <div>
                                        <span className="product-category">{product.category}</span>
                                        <h3>
                                            <Link
                                                href={`/product/${product.id}`}
                                                onClick={(event) => openProductPreview(event, product)}
                                                aria-haspopup="dialog"
                                            >
                                                {product.name}
                                            </Link>
                                        </h3>
                                        <p>{product.description}</p>
                                    </div>
                                    <strong className="product-price">${product.price.toFixed(2)}</strong>
                                </div>
                                <div className="product-card-actions">
                                    <button className="add-button" onClick={() => addToCartItem(product)}>
                                        Add to bag <span>↗</span>
                                    </button>
                                    <Link
                                        href={`/product/${product.id}`}
                                        className="text-link product-link"
                                        onClick={(event) => openProductPreview(event, product)}
                                        aria-haspopup="dialog"
                                    >
                                        View details
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="empty-search">
                        <span>✿</span>
                        <h3>No petals found.</h3>
                        <p>Try another search or choose a different category.</p>
                        <button
                            className="button button-dark"
                            onClick={() => {
                                setSearch("");
                                setCategory("All");
                            }}
                        >
                            See all products
                        </button>
                    </div>
                )}
                <p className="demo-note">
                    Product names, descriptions, prices, and images are sample demo content.
                </p>
            </section>

            <section className="ritual-section" id="ritual">
                <div className="ritual-image">
                    <Image
                        src="https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=1000&q=85"
                        alt="Skincare products arranged in a calm botanical setting"
                        width={1000}
                        height={1200}
                    />
                    <span className="image-caption">SLOW DOWN. SOFTEN. GLOW.</span>
                </div>
                <div className="ritual-copy">
                    <div className="eyebrow">A GENTLER KIND OF BEAUTY</div>
                    <h2>Make room for a little <em>self-love.</em></h2>
                    <p>
                        Your skincare routine doesn&apos;t need to be complicated. It can be
                        three quiet minutes, a deep breath, and a moment just for you.
                    </p>
                    <div className="ritual-steps">
                        <div><span>01</span><div><strong>Cleanse gently</strong><small>Start fresh without the rush.</small></div></div>
                        <div><span>02</span><div><strong>Nourish thoughtfully</strong><small>Choose care that suits your skin.</small></div></div>
                        <div><span>03</span><div><strong>Glow in your own way</strong><small>Let consistency be your ritual.</small></div></div>
                    </div>
                    <a className="button button-dark" href="#shop">Find your essentials ↗</a>
                </div>
            </section>

            <section className="story-section section-pad" id="story">
                <span className="story-flower">✳</span>
                <div className="eyebrow">A NOTE FROM FLORALYN</div>
                <h2>Beauty grows when we <em>care gently.</em></h2>
                <p>
                    We believe skincare can be a small act of kindness to yourself.
                    Floralyn Skin is a botanical-inspired world of simple routines,
                    thoughtful choices, and everyday moments that help you feel at home
                    in your own skin.
                </p>
                <a href="#shop" className="text-link">Explore our collection ↗</a>
            </section>

            <section className="newsletter-section">
                <div className="newsletter-flower">✿</div>
                <div>
                    <div className="eyebrow">A LITTLE LOVE IN YOUR INBOX</div>
                    <h2>Notes from our <em>garden.</em></h2>
                    <p>Skincare tips, little rituals, and first looks at new arrivals.</p>
                </div>
                <form
                    className="newsletter-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setNotice("Thanks for joining our garden! Connect an email service to save subscribers.");
                    }}
                >
                    <input type="email" placeholder="Your email address" required aria-label="Your email address" />
                    <button type="submit" aria-label="Subscribe">Join us ↗</button>
                </form>
                <small className="newsletter-disclaimer">A gentle note now and then. Unsubscribe whenever you like.</small>
            </section>

            <footer className="site-footer">
                <div className="footer-main">
                    <div className="footer-brand">
                        <Link href="#home" className="brand">
                            <span className="brand-mark">✳</span>
                            <span>FLORALYN<small>BOTANICAL SKINCARE</small></span>
                        </Link>
                        <p>A little nature, a little luxury.<br />Your everyday moment of calm.</p>
                    </div>
                    <div className="footer-column">
                        <strong>Explore</strong>
                        <a href="#shop">Shop all</a>
                        <a href="#ritual">Our ritual</a>
                        <a href="#story">Our story</a>
                    </div>
                    <div className="footer-column">
                        <strong>Need a hand?</strong>
                        <a href="mailto:hello@floralynskin.example">Contact us</a>
                        <Link href="/wishlist">Wishlist</Link>
                        <Link href="/account">Customer account</Link>
                        <Link href="/cart">Shopping bag</Link>
                        <Link href="/admin">Store management</Link>
                    </div>
                    <div className="footer-note">
                        <span>✿</span>
                        <p>Take a breath.<br /><em>You&apos;re blooming just fine.</em></p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>© 2026 Floralyn Skin. Demo storefront.</span>
                    <span>Made with care &amp; a little botanical magic ✳</span>
                </div>
            </footer>

            {notice && (
                <div className="toast" role="status">
                    <span>✿</span> {notice}
                    <button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
                </div>
            )}

            {cartOpen && (
                <div className="drawer-backdrop" onClick={() => setCartOpen(false)}>
                    <aside
                        className="cart-drawer"
                        onClick={(event) => event.stopPropagation()}
                        aria-label="Shopping bag"
                    >
                        <div className="drawer-header">
                            <div>
                                <span className="eyebrow">YOUR LITTLE COLLECTION</span>
                                <h2>Your bag <em>({cartCount})</em></h2>
                            </div>
                            <button className="close-button" onClick={() => setCartOpen(false)} aria-label="Close cart">×</button>
                        </div>

                        {cartItems.length === 0 ? (
                            <div className="cart-empty">
                                <span>✿</span>
                                <h3>Your bag is blooming empty.</h3>
                                <p>Find something lovely for your daily ritual.</p>
                                <button
                                    className="button button-dark"
                                    onClick={() => {
                                        setCartOpen(false);
                                        document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                >
                                    Explore the collection
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="cart-items">
                                    {cartItems.map((product) => (
                                        <div className="cart-item" key={product.id}>
                                            <Image src={product.image} alt={product.name} width={120} height={150} />
                                            <div className="cart-item-info">
                                                <span>{product.category}</span>
                                                <h3>{product.name}</h3>
                                                <strong>${product.price.toFixed(2)}</strong>
                                                <div className="quantity-control">
                                                    <button onClick={() => changeQuantity(product.id, -1)} aria-label={`Remove one ${product.name}`}>−</button>
                                                    <span>{cart[product.id]}</span>
                                                    <button onClick={() => changeQuantity(product.id, 1)} aria-label={`Add one ${product.name}`}>+</button>
                                                </div>
                                            </div>
                                            <strong className="line-price">${(product.price * (cart[product.id] || 0)).toFixed(2)}</strong>
                                        </div>
                                    ))}
                                </div>
                                <div className="cart-summary">
                                    <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
                                    <p>Shipping and any applicable taxes are calculated at checkout.</p>
                                    <Link
                                        href="/checkout"
                                        className="button button-dark checkout-button"
                                        onClick={() => setCartOpen(false)}
                                    >
                                        Continue to checkout ↗
                                    </Link>
                                    <button className="continue-shopping" onClick={() => setCartOpen(false)}>Continue shopping</button>
                                </div>
                            </>
                        )}
                    </aside>
                </div>
            )}

            {previewProduct && (
                <div
                    className="product-preview-backdrop"
                    onClick={(event) => {
                        if (event.target === event.currentTarget) closeProductPreview();
                    }}
                >
                    <aside
                        ref={previewPanelRef}
                        className="product-preview-panel"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="product-preview-title"
                        tabIndex={-1}
                    >
                        <div className="product-preview-header">
                            <span className="eyebrow">A CLOSER LOOK</span>
                            <button
                                className="close-button"
                                onClick={closeProductPreview}
                                aria-label="Close product details"
                            >
                                ×
                            </button>
                        </div>
                        <div className="product-preview-image">
                            <Image
                                src={previewProduct.image}
                                alt={previewProduct.name}
                                width={800}
                                height={960}
                                priority
                            />
                            <span className="product-tag">{previewProduct.tag}</span>
                        </div>
                        <div className="product-preview-content">
                            <span className="product-category">{previewProduct.category}</span>
                            <h2 id="product-preview-title">{previewProduct.name}</h2>
                            <strong className="product-preview-price">
                                ${previewProduct.price.toFixed(2)}
                            </strong>
                            <p>{previewProduct.detail}</p>
                            <ul className="benefit-list">
                                {previewProduct.benefits.map((benefit) => (
                                    <li key={benefit}>{benefit}</li>
                                ))}
                            </ul>
                            <button
                                className="button button-dark product-preview-add"
                                onClick={addPreviewProductToCart}
                            >
                                Add to bag <span>↗</span>
                            </button>
                            <Link
                                href={`/product/${previewProduct.id}`}
                                className="text-link product-preview-full-link"
                                onClick={closeProductPreview}
                            >
                                View full product details ↗
                            </Link>
                        </div>
                    </aside>
                </div>
            )}
        </main>
    );
}
