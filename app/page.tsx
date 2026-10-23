"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";

import BrandMark from "@/components/BrandMark";
import { addToCart, changeCartQuantity, getCartCount, useCart } from "@/lib/cart";
import { saveAppliedPromo, useAppliedPromo } from "@/lib/discounts";
import { brandFilters, categories, mergeCatalog, products, type Product } from "@/lib/products";

const ritualHighlights = [
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
        ),
        title: "Hydrate deeply",
        description: "Plump, cushion, and comfort skin with barrier-loving formulas.",
    },
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
        ),
        title: "Calm the day",
        description: "Soft botanicals help ease stress, redness, and afternoon fatigue.",
    },
    {
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
        ),
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
                (selectedBrand === "Cambodian Heritage" && product.origin === "Cambodian Botanical") ||
                (selectedBrand === "Beauty of Joseon" && product.brand === "Beauty of Joseon") ||
                (selectedBrand === "Skin1004" && product.brand === "Skin1004") ||
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

    const HERO_STAR_IDS = [29, 17, 33, 1, 30]; // Skin1004 Sun Serum, Anua 77% Toner, Mary & May Blackberry, Dew Drop Serum, Skin1004 Poremizing
    const heroProducts = useMemo(() => {
        const curated = HERO_STAR_IDS.map((id) => catalog.find((p) => p.id === id)).filter(Boolean) as Product[];
        return curated.length > 0 ? curated : (catalog.length > 0 ? catalog.slice(0, 5) : products.slice(0, 5));
    }, [catalog]);

    const currentHeroProduct = heroProducts[heroIndex] || heroProducts[0];

    const activeHotspots = useMemo(() => {
        const b1 = currentHeroProduct?.benefits?.[0] || "Botanical Formulation";
        const b2 = currentHeroProduct?.benefits?.[1] || "Clinical Barrier Defense";
        return [
            {
                id: 1,
                top: "32%",
                left: "66%",
                tag: currentHeroProduct?.tag || "ACTIVE",
                title: b1,
                desc: `Formulated with high-potency actives to deliver ${b1.toLowerCase()} and lasting skin comfort.`,
            },
            {
                id: 2,
                top: "66%",
                left: "30%",
                tag: "TARGETED ROLE",
                title: b2,
                desc: `Designated routine role: ${currentHeroProduct?.role || "Barrier restoration"}.`,
            },
        ];
    }, [currentHeroProduct]);

    useEffect(() => {
        if (isHeroPaused || heroProducts.length <= 1) return;
        const interval = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % heroProducts.length);
        }, 5500);
        return () => clearInterval(interval);
    }, [isHeroPaused, heroProducts.length]);

    function addToCartItem(product: Product) {
        addToCart(product.id);
        setNotice(`${product.name} added to your bag`);
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
        setNotice(`${previewProduct.name} added to your bag`);
    }

    return (
        <main>
            <div className="announcement">
                A little nature, a little luxury — enjoy 10% off your first order
                <span> · </span> Use code <strong> BLOOM10 </strong>
            </div>

            <header className="site-header">
                <Link href="#home" className="brand" aria-label="Floralyn Skin home">
                    <BrandMark />
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
                {/* Floating luminous botanical sparkles & dewdrops (crystal clear) */}
                <div className="hero-particles" aria-hidden="true">
                    <div className="sparkle-svg sparkle-1">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" fill="url(#sparkleGrad1)" />
                            <defs>
                                <linearGradient id="sparkleGrad1" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#dfcb9e" stopOpacity="0.85" />
                                    <stop offset="1" stopColor="#a3b499" stopOpacity="0.4" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <div className="sparkle-svg sparkle-2">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" fill="url(#sparkleGrad2)" />
                            <defs>
                                <linearGradient id="sparkleGrad2" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#ecd8b4" stopOpacity="0.75" />
                                    <stop offset="1" stopColor="#b5c4ad" stopOpacity="0.3" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    <div className="sparkle-svg sparkle-3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 0C12 7 7 12 0 12C7 12 12 17 12 24C12 17 17 12 24 12C17 12 12 7 12 0Z" fill="url(#sparkleGrad1)" />
                        </svg>
                    </div>

                    <div className="sparkle-svg dewdrop-1">
                        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                            <circle cx="11" cy="11" r="9" stroke="rgba(163, 180, 154, 0.45)" strokeWidth="1.5" strokeDasharray="2 3" />
                            <circle cx="11" cy="11" r="4" fill="rgba(223, 203, 158, 0.6)" />
                        </svg>
                    </div>

                    <div className="sparkle-svg dewdrop-2">
                        <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                            <circle cx="13" cy="13" r="11" stroke="rgba(223, 203, 158, 0.4)" strokeWidth="1.2" />
                            <circle cx="13" cy="13" r="5" fill="rgba(163, 180, 154, 0.5)" />
                        </svg>
                    </div>
                </div>

                <div className="hero-copy">
                    {/* Clean editorial meta with brand & routine role */}
                    <div className="hero-clean-meta hero-fade-up">
                        <span className="clean-brand-tag">{currentHeroProduct.brand}</span>
                        {currentHeroProduct.role && (
                            <>
                                <span className="clean-dot">·</span>
                                <span className="clean-role-tag">Routine Role: {currentHeroProduct.role}</span>
                            </>
                        )}
                    </div>

                    <h1 className="hero-product-title hero-fade-up hero-delay-1" key={`h1-${currentHeroProduct.id}`}>
                        {currentHeroProduct.name.split(" - ")[1] || currentHeroProduct.name}
                    </h1>

                    <p className="hero-product-desc hero-fade-up hero-delay-2" key={`desc-${currentHeroProduct.id}`}>
                        {currentHeroProduct.description}
                    </p>

                    {/* Key formula highlights */}
                    <div className="hero-clean-benefits hero-fade-up hero-delay-2" key={`benefits-${currentHeroProduct.id}`}>
                        {currentHeroProduct.benefits.slice(0, 3).map((benefit, i) => (
                            <span key={i} className="clean-benefit-item">
                                <span className="clean-check">✓</span> {benefit}
                            </span>
                        ))}
                    </div>

                    {/* Clean primary actions */}
                    <div className="hero-clean-actions hero-fade-up hero-delay-3">
                        <button
                            type="button"
                            className="button button-dark hero-cta-button"
                            onClick={() => addToCartItem(currentHeroProduct)}
                        >
                            Add to bag <span>+</span>
                        </button>
                        <a className="button button-clean-ghost" href="#shop">
                            Explore catalog <span>↓</span>
                        </a>
                    </div>
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
                                ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`
                                : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
                            transition: isHovered
                                ? "transform 0.12s cubic-bezier(0.2, 0, 0, 1)"
                                : "transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                    >
                        {/* Crystalline luminous ambient halo (clean & centered) */}
                        <div className="hero-ambient-glow" aria-hidden="true" />

                        {/* Interactive Traveling Conic Light Beam Border */}
                        <div className="hero-border-beam-wrap" aria-hidden="true">
                            <div className="hero-border-beam-spinner" />
                        </div>

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
                                    background: `radial-gradient(circle 320px at ${mousePos.x}% ${mousePos.y}%, rgba(255, 255, 255, 0.52) 0%, rgba(255, 255, 255, 0.15) 35%, transparent 75%)`,
                                    opacity: isHovered ? 1 : 0.3,
                                }}
                            />

                            <div className="hero-image-overlay" />

                            {/* Interactive Feature Hotspot Pins */}
                            {activeHotspots.map((spot) => (
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
                                        <span className="hotspot-pulse pulse-delay" />
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
                                <span className="seal-orbit-ring" />
                                <span className="seal-label">FLORALYN</span>
                                <BrandMark className="seal-flower" size={26} />
                                <span className="seal-sub">PURE RITUAL</span>
                            </div>
                        </div>
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
                <div><span className="trust-bullet">•</span> Nature-inspired care</div>
                <div><span className="trust-bullet">•</span> Gentle daily rituals</div>
                <div><span className="trust-bullet">•</span> Thoughtfully selected ingredients</div>
                <div><span className="trust-bullet">•</span> A little luxury, every day</div>
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
                                                <span className="role-sparkle">•</span>
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
                        <BrandMark size={32} />
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
                <BrandMark className="story-flower" size={140} />
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
                <BrandMark className="newsletter-flower" size={60} />
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
                            <BrandMark />
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
                        <BrandMark size={16} />
                        <p>Take a breath.<br /><em>You&apos;re blooming just fine.</em></p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>© 2026 Floralyn Skin. Demo storefront.</span>
                    <span>Made with care &amp; a little botanical magic.</span>
                </div>
            </footer>

            {notice && (
                <div className="toast" role="status">
                    {notice}
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
                                <BrandMark size={36} />
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
                                                <span className="promo-sparkle">•</span>
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
                                    Function & Role: {previewProduct.role}
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
