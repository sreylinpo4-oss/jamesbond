"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import { addToCart, changeCartQuantity, getCartCount, useCart } from "@/lib/cart";
import { saveAppliedPromo, useAppliedPromo } from "@/lib/discounts";
import { brandFilters, categories, mergeCatalog, products, type Product } from "@/lib/products";

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

const productHotspots = [
    {
        id: 1,
        top: "30%",
        left: "64%",
        tag: "COLD-SEAL DROPPER",
        title: "Active Oxidation Shield",
        desc: "Precision pipette preserves 100% nutrient potency and dispenses exact micro-doses.",
    },
    {
        id: 2,
        top: "65%",
        left: "32%",
        tag: "CLINICALLY PROVEN",
        title: "Bio-Fermented Squalane",
        desc: "Deep skin barrier replenishment that locks hydration for 48 hours without oiliness.",
    },
];

export default function Home() {
    const [catalog, setCatalog] = useState<Product[]>(products);
    const [category, setCategory] = useState("All");
    const [selectedBrand, setSelectedBrand] = useState("All");
    const [search, setSearch] = useState("");
    const cart = useCart();
    const [cartOpen, setCartOpen] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [notice, setNotice] = useState("");
    const [heroIndex, setHeroIndex] = useState(0);
    const [isHeroPaused, setIsHeroPaused] = useState(false);
    const [heroAddedNotice, setHeroAddedNotice] = useState(false);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);
    const [activeHotspot, setActiveHotspot] = useState<number | null>(null);
    const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
    const visualRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const previewPanelRef = useRef<HTMLElement>(null);
    const previewTriggerRef = useRef<HTMLAnchorElement>(null);

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

    const filteredProducts = useMemo(() => {
        return catalog.filter((product) => {
            const matchesCategory =
                category === "All" || product.category === category;

            const matchesBrand =
                selectedBrand === "All" ||
                (selectedBrand === "🇰🇭 Cambodian Heritage" && product.origin === "Cambodian Botanical") ||
                (selectedBrand === "Beauty of Joseon" && product.brand === "Beauty of Joseon") ||
                (selectedBrand === "Anua" && product.brand === "Anua") ||
                (selectedBrand === "Mary & May" && product.brand === "Mary & May") ||
                (selectedBrand === "K-Beauty Hits" && (product.origin === "Korean Skincare" || ["Skin1004", "Round Lab", "COSRX"].includes(product.brand))) ||
                (selectedBrand === "Floralyn Signature" && product.origin === "Floralyn Signature");

            const q = search.toLowerCase().trim();
            const matchesSearch =
                !q ||
                product.name.toLowerCase().includes(q) ||
                product.description.toLowerCase().includes(q) ||
                (product.brand && product.brand.toLowerCase().includes(q)) ||
                (product.role && product.role.toLowerCase().includes(q)) ||
                (product.tag && product.tag.toLowerCase().includes(q)) ||
                (product.benefits && product.benefits.some((b) => b.toLowerCase().includes(q)));

            return matchesCategory && matchesBrand && matchesSearch;
        });
    }, [catalog, category, selectedBrand, search]);

    const cartItems = catalog.filter((product) => (cart[product.id] || 0) > 0);
    const cartCount = getCartCount(cart);
    const subtotal = cartItems.reduce(
        (total, product) => total + product.price * (cart[product.id] || 0),
        0
    );

    const appliedPromo = useAppliedPromo();
    const discountDollars = (appliedPromo?.discountCents ?? 0) / 100;

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

    const heroProducts = useMemo(() => {
        return catalog.length > 0 ? catalog.slice(0, 4) : products.slice(0, 4);
    }, [catalog]);

    const currentHeroProduct = heroProducts[heroIndex] || heroProducts[0];

    useEffect(() => {
        if (isHeroPaused || heroProducts.length <= 1) return;
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroProducts.length);
        }, 5500);
        return () => clearInterval(interval);
    }, [isHeroPaused, heroProducts.length]);

    function addToCartItem(product: Product) {
        addToCart(product.id);
        setNotice(`${product.name} added to your bag 🌿`);
        window.setTimeout(() => setNotice(""), 2500);
    }

    function handleVisualMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!visualRef.current) return;
        const rect = visualRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPct = (x / rect.width) * 2 - 1;
        const yPct = (y / rect.height) * 2 - 1;
        setTilt({
            x: -yPct * 6.5,
            y: xPct * 8,
        });
        setMousePos({
            x: Math.round((x / rect.width) * 100),
            y: Math.round((y / rect.height) * 100),
        });
    }

    function handleVisualMouseEnter() {
        setIsHovered(true);
        setIsHeroPaused(true);
    }

    function handleVisualMouseLeave() {
        setIsHovered(false);
        setIsHeroPaused(false);
        setTilt({ x: 0, y: 0 });
        setActiveHotspot(null);
    }

    function handleHeroQuickAdd(event: React.MouseEvent<HTMLButtonElement>, product: Product) {
        event.stopPropagation();
        addToCartItem(product);
        setHeroAddedNotice(true);
        const newSparkles = Array.from({ length: 5 }).map((_, i) => ({
            id: Date.now() + i,
            x: Math.round((Math.random() - 0.5) * 60),
            y: Math.round(-Math.random() * 45 - 20),
        }));
        setSparkles(newSparkles);
        window.setTimeout(() => setSparkles([]), 850);
        window.setTimeout(() => setHeroAddedNotice(false), 2200);
    }

    function prevHeroProduct() {
        setHeroIndex((prev) => (prev === 0 ? heroProducts.length - 1 : prev - 1));
    }

    function nextHeroProduct() {
        setHeroIndex((prev) => (prev + 1) % heroProducts.length);
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
                {/* Floating cinematic botanical SVG petals & bokeh */}
                <div className="hero-particles" aria-hidden="true">
                    <div className="petal-svg bokeh-1">
                        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                            <circle cx="30" cy="30" r="28" fill="url(#bokehGrad1)" />
                            <defs>
                                <radialGradient id="bokehGrad1" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#dce4d5" stopOpacity="0.55" />
                                    <stop offset="100%" stopColor="#dce4d5" stopOpacity="0" />
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="petal-svg bokeh-2">
                        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
                            <circle cx="35" cy="35" r="32" fill="url(#bokehGrad2)" />
                            <defs>
                                <radialGradient id="bokehGrad2" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#edd8ce" stopOpacity="0.45" />
                                    <stop offset="100%" stopColor="#edd8ce" stopOpacity="0" />
                                </radialGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="petal-svg leaf-1">
                        <svg width="34" height="46" viewBox="0 0 34 46" fill="none">
                            <path d="M17 2C7 16 7 30 17 44C27 30 27 16 17 2Z" fill="url(#leafGrad1)" />
                            <path d="M17 7L17 39" stroke="rgba(255,255,255,0.45)" strokeWidth="1" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="leafGrad1" x1="17" y1="2" x2="17" y2="44" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#87977d" stopOpacity="0.5" />
                                    <stop offset="1" stopColor="#4c6351" stopOpacity="0.35" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="petal-svg petal-2">
                        <svg width="30" height="34" viewBox="0 0 30 34" fill="none">
                            <path d="M15 3C9 3 4 8 4 16C4 24 15 32 15 32C15 32 26 24 26 16C26 8 21 3 15 3Z" fill="url(#petalGrad1)" />
                            <defs>
                                <linearGradient id="petalGrad1" x1="15" y1="3" x2="15" y2="32" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#d8b4a6" stopOpacity="0.48" />
                                    <stop offset="1" stopColor="#c5a193" stopOpacity="0.3" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="petal-svg leaf-3">
                        <svg width="28" height="38" viewBox="0 0 28 38" fill="none">
                            <path d="M14 2C6 13 6 25 14 36C22 25 22 13 14 2Z" fill="url(#leafGrad2)" />
                            <defs>
                                <linearGradient id="leafGrad2" x1="14" y1="2" x2="14" y2="36" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#a3b499" stopOpacity="0.5" />
                                    <stop offset="1" stopColor="#7a8d71" stopOpacity="0.32" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <div className="petal-svg petal-4">
                        <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                            <path d="M12 2C7 2 3 6 3 13C3 20 12 26 12 26C12 26 21 20 21 13C21 6 17 2 12 2Z" fill="url(#goldGrad)" />
                            <defs>
                                <linearGradient id="goldGrad" x1="12" y1="2" x2="12" y2="26" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#dfcb9e" stopOpacity="0.5" />
                                    <stop offset="1" stopColor="#baa77b" stopOpacity="0.25" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                <div className="hero-copy">
                    <div className="hero-editorial-meta hero-fade-up">
                        <span className="editorial-counter">
                            0{heroIndex + 1} <small>/ 0{heroProducts.length}</small>
                        </span>
                        <span className="meta-divider">|</span>
                        <span className="batch-status-badge">
                            <span className="live-status-dot" />
                            COLD-PRESSED SMALL BATCH
                        </span>
                    </div>

                    <div className="eyebrow hero-fade-up">
                        <span className="eyebrow-line" />
                        <span>YOUR DAILY MOMENT OF CALM</span>
                    </div>
                    <h1 className="hero-fade-up hero-delay-1">
                        Let your skin
                        <br />
                        <span className="bloom-gradient-text"><em>bloom naturally.</em></span>
                    </h1>
                    <p className="hero-description hero-fade-up hero-delay-2">
                        Thoughtful skincare inspired by nature. Gentle rituals, botanical
                        ingredients, and a little everyday luxury for your skin.
                    </p>

                    {/* Featured product spotlight tabs */}
                    <div className="hero-product-chips hero-fade-up hero-delay-2" role="tablist" aria-label="Featured skincare essentials">
                        <span className="chips-label">Spotlight:</span>
                        {heroProducts.map((p, idx) => (
                            <button
                                key={p.id}
                                role="tab"
                                type="button"
                                aria-selected={idx === heroIndex}
                                className={idx === heroIndex ? "hero-chip active" : "hero-chip"}
                                onClick={() => setHeroIndex(idx)}
                            >
                                <span className="chip-dot" />
                                {p.name}
                            </button>
                        ))}
                    </div>

                    <div className="hero-buttons hero-fade-up hero-delay-3">
                        <a className="button button-dark hero-cta-button" href="#shop">
                            Discover your ritual <span>↗</span>
                        </a>
                        <a className="text-link" href="#story">
                            Our philosophy ↗
                        </a>
                    </div>

                    <div className="hero-social-proof hero-fade-up hero-delay-4">
                        <div className="proof-avatars">
                            <span className="proof-avatar">🌿</span>
                            <span className="proof-avatar">🌸</span>
                            <span className="proof-avatar">✨</span>
                        </div>
                        <div className="proof-content">
                            <div className="proof-stars">★★★★★ <strong>4.9/5 Rating</strong></div>
                            <p>&ldquo;My routine transformed within 3 days. Pure botanical magic.&rdquo;</p>
                        </div>
                    </div>

                    <div className="hero-note hero-fade-up hero-delay-4">
                        <span className="note-icon">✳</span>
                        <span>
                            <strong>Less, but more intentional.</strong>
                            <small>Skincare that feels like a deep breath.</small>
                        </span>
                    </div>
                    <span className="hero-decoration hero-fade-up hero-delay-4">grow gently · glow softly</span>
                </div>

                <div
                    className="hero-visual"
                    ref={visualRef}
                    onMouseMove={handleVisualMouseMove}
                    onMouseEnter={handleVisualMouseEnter}
                    onMouseLeave={handleVisualMouseLeave}
                    onTouchStart={() => setIsHeroPaused(true)}
                    onTouchEnd={() => setIsHeroPaused(false)}
                >
                    {/* 3D Tilting Perspective Container */}
                    <div
                        className="hero-3d-card"
                        style={{
                            transform: isHovered
                                ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
                                : "perspective(1000px) rotateX(0deg) rotateY(0deg)",
                            transition: isHovered
                                ? "transform 0.12s cubic-bezier(0.2, 0, 0, 1)"
                                : "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    >
                        {/* Glowing ambient radial aura (deep Z-depth) */}
                        <div className="hero-ambient-glow" aria-hidden="true" />

                        {/* Active product image with smooth crossfade and keyframe entrance */}
                        <div className="hero-image-frame" key={currentHeroProduct?.id || heroIndex}>
                            <Image
                                className="hero-image-animated"
                                src={currentHeroProduct?.image || "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=90"}
                                alt={currentHeroProduct?.name || "Elegant skincare products"}
                                width={1200}
                                height={1200}
                                priority
                            />

                            {/* Dynamic Specular Lens Sheen following cursor */}
                            <div
                                className="hero-specular-sheen"
                                style={{
                                    background: `radial-gradient(circle 280px at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0.1) 40%, transparent 80%)`,
                                    opacity: isHovered ? 1 : 0.25,
                                }}
                            />

                            <div className="hero-image-overlay" />

                            {/* Interactive Feature Hotspot Pins */}
                            {productHotspots.map((spot) => (
                                <div
                                    key={spot.id}
                                    className={`hero-hotspot ${activeHotspot === spot.id ? "active" : ""}`}
                                    style={{ top: spot.top, left: spot.left }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveHotspot(activeHotspot === spot.id ? null : spot.id);
                                    }}
                                    onMouseEnter={() => setActiveHotspot(spot.id)}
                                    onMouseLeave={() => setActiveHotspot(null)}
                                >
                                    <button
                                        type="button"
                                        className="hotspot-trigger"
                                        aria-label={`Explore ${spot.title}`}
                                    >
                                        <span className="hotspot-pulse" />
                                        <span className="hotspot-dot" />
                                    </button>

                                    <div className="hotspot-tooltip">
                                        <span className="hotspot-tag">{spot.tag}</span>
                                        <strong>{spot.title}</strong>
                                        <p>{spot.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Carousel Navigation Arrows */}
                        <div className="hero-carousel-nav" aria-label="Hero product navigation">
                            <button
                                type="button"
                                className="hero-arrow-btn prev"
                                onClick={prevHeroProduct}
                                aria-label="Previous product"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                className="hero-arrow-btn next"
                                onClick={nextHeroProduct}
                                aria-label="Next product"
                            >
                                ›
                            </button>
                        </div>

                        {/* Floating Rotating Ritual Seal (3D z-depth) */}
                        <div className="floating-seal-wrapper">
                            <div className="floating-seal">
                                <span>YOUR SKIN</span>
                                <span className="seal-flower">✳</span>
                                <span>YOUR RITUAL</span>
                            </div>
                        </div>

                        {/* Interactive Animated Product Spotlight Card (Forefront 3D pop) */}
                        {currentHeroProduct && (
                            <div className="hero-product-badge" key={`badge-${currentHeroProduct.id}`}>
                                <div className="badge-header">
                                    <span className="badge-tag">{currentHeroProduct.tag}</span>
                                    <span className="badge-rating">
                                        ★ 4.9 <small>(120+)</small>
                                    </span>
                                </div>

                                <div className="badge-body">
                                    <Link
                                        href={`/product/${currentHeroProduct.id}`}
                                        onClick={(e) => openProductPreview(e, currentHeroProduct)}
                                        className="badge-title"
                                        aria-haspopup="dialog"
                                    >
                                        {currentHeroProduct.name}
                                    </Link>
                                    <span className="badge-category">{currentHeroProduct.category}</span>
                                </div>

                                <div className="badge-benefits">
                                    {currentHeroProduct.benefits.slice(0, 2).map((benefit, i) => (
                                        <span key={i} className="benefit-pill">
                                            ✓ {benefit}
                                        </span>
                                    ))}
                                </div>

                                <div className="badge-footer">
                                    <span className="badge-price">${currentHeroProduct.price.toFixed(2)}</span>
                                    <div className="badge-btn-wrap">
                                        <button
                                            type="button"
                                            className={`badge-add-btn ${heroAddedNotice ? "added" : ""}`}
                                            onClick={(e) => handleHeroQuickAdd(e, currentHeroProduct)}
                                            aria-label={`Add ${currentHeroProduct.name} to bag`}
                                        >
                                            {heroAddedNotice ? "Added 🌿" : "Add to bag +"}
                                        </button>
                                        {/* Sparkle burst particles */}
                                        {sparkles.map((sp) => (
                                            <span
                                                key={sp.id}
                                                className="sparkle-particle"
                                                style={{
                                                    "--tx": `${sp.x}px`,
                                                    "--ty": `${sp.y}px`,
                                                } as React.CSSProperties}
                                            >
                                                ✦
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Carousel Thumbnail Gallery Dock & Progress Indicators */}
                    <div className="hero-progress-bars" role="tablist" aria-label="Select hero product">
                        {heroProducts.map((p, idx) => (
                            <button
                                type="button"
                                key={p.id}
                                className={`hero-progress-indicator ${idx === heroIndex ? "active" : ""}`}
                                onClick={() => setHeroIndex(idx)}
                                aria-label={`View ${p.name}`}
                                aria-selected={idx === heroIndex}
                                role="tab"
                            >
                                <div className="indicator-thumb-wrap">
                                    <Image
                                        src={p.image}
                                        alt={p.name}
                                        width={44}
                                        height={44}
                                        className="indicator-thumb-img"
                                    />
                                    <span className="indicator-thumb-price">${p.price}</span>
                                </div>
                                <span className="indicator-track">
                                    <span
                                        className="indicator-fill"
                                        style={{
                                            animationDuration: "5500ms",
                                            animationPlayState: isHeroPaused ? "paused" : "running",
                                        }}
                                    />
                                </span>
                                <span className="indicator-label">{p.name}</span>
                            </button>
                        ))}
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

                <div className="shop-controls" style={{ flexDirection: "column", alignItems: "stretch", gap: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                        {/* Functional Category Filter Tabs */}
                        <div className="category-tabs" role="group" aria-label="Filter by function">
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

                        {/* Search Input */}
                        <label className="search-box" style={{ maxWidth: "340px", flex: 1 }}>
                            <span>⌕</span>
                            <input
                                ref={searchInputRef}
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by name, brand, function (e.g. SPF, cica, rice)..."
                                aria-label="Search products"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    style={{ background: "none", border: 0, cursor: "pointer", color: "#666", fontSize: "14px" }}
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </label>
                    </div>

                    {/* Brand & Line Filter Pills */}
                    <div className="brand-filter-pills" role="group" aria-label="Filter by brand or collection">
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-sage, #3e5a4a)", display: "flex", alignItems: "center", marginRight: "4px" }}>
                            Collection:
                        </span>
                        {brandFilters.map((brand) => (
                            <button
                                key={brand}
                                type="button"
                                className={selectedBrand === brand ? "brand-pill active" : "brand-pill"}
                                onClick={() => setSelectedBrand(brand)}
                            >
                                {brand}
                            </button>
                        ))}
                    </div>
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
                                        <div className="product-brand-row">
                                            {product.brand && <span className="product-brand-tag">{product.brand}</span>}
                                            <span className="product-category">{product.category}</span>
                                        </div>
                                        {product.role && (
                                            <div className="product-role-line">
                                                <span className="role-sparkle">✦</span>
                                                <span className="product-role">{product.role}</span>
                                            </div>
                                        )}
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
                                    {appliedPromo && (
                                        <div className="promo-applied-tag" style={{ marginBottom: "12px" }}>
                                            <div className="promo-info">
                                                <span className="promo-sparkle">✦</span>
                                                <div>
                                                    <strong>{appliedPromo.code}</strong>
                                                    <small>{appliedPromo.name}</small>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="promo-remove-btn"
                                                onClick={() => saveAppliedPromo(null)}
                                                aria-label="Remove promo code"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    <div className="summary-row" style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Subtotal</span>
                                        <strong>${subtotal.toFixed(2)}</strong>
                                    </div>
                                    {discountDollars > 0 && (
                                        <div className="summary-row discount-row" style={{ display: "flex", justifyContent: "space-between", color: "#2d6a4f", fontWeight: 600 }}>
                                            <span>Discount ({appliedPromo?.code})</span>
                                            <span>−${discountDollars.toFixed(2)}</span>
                                        </div>
                                    )}
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
                            <div className="product-brand-row" style={{ marginBottom: "6px" }}>
                                {previewProduct.brand && <span className="product-brand-tag">{previewProduct.brand}</span>}
                                <span className="product-category">{previewProduct.category}</span>
                            </div>
                            <h2 id="product-preview-title">{previewProduct.name}</h2>
                            {previewProduct.role && (
                                <p className="product-role-tag">
                                    ✦ Function & Role: {previewProduct.role}
                                </p>
                            )}
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
