"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { addToCart } from "@/lib/cart";
import { saveAppliedPromo } from "@/lib/discounts";
import { products, type Product } from "@/lib/products";

export type ChatMessage = {
    id: string;
    sender: "bot" | "user";
    text: string;
    products?: Product[];
    action?: {
        type: "discount" | "link";
        code?: string;
        url?: string;
        label?: string;
    };
    timestamp: string;
};

function ChatBubbleIcon({ size = 16 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function BotanicalAvatarIcon({ size = 14 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2C10.5 4.5 10.5 7.5 12 9.5C13.5 7.5 13.5 4.5 12 2Z" />
            <path d="M12 22C10.5 19.5 10.5 16.5 12 14.5C13.5 16.5 13.5 19.5 12 22Z" />
            <path d="M2 12C4.5 10.5 7.5 10.5 9.5 12C7.5 13.2 5 13.2 2 12Z" />
            <path d="M22 12C19.5 10.5 16.5 10.5 14.5 12C16.5 13.2 19 13.2 22 12Z" />
        </svg>
    );
}

const INITIAL_SUGGESTIONS = [
    { label: "Cambodian Local Skincare", query: "What Cambodian local botanical products do you have?" },
    { label: "Korean Skincare (K-Beauty)", query: "Tell me about your Korean skincare brands like Beauty of Joseon and Anua" },
    { label: "Best Sunscreens SPF50+", query: "What are your best sunscreens for daily protection?" },
    { label: "10% Discount Code", query: "Do you have a discount code for my order?" },
    { label: "Calming & Redness Routine", query: "What routine is best for sensitive, redness-prone skin?" },
    { label: "Dark Spots & Glow", query: "What products help with dark spots, hyperpigmentation, and glow?" },
];

function getBotReply(input: string, catalog: Product[]): Omit<ChatMessage, "id" | "sender" | "timestamp"> {
    const q = input.toLowerCase();

    // 1. Discount / coupon / promo
    if (
        q.includes("discount") ||
        q.includes("code") ||
        q.includes("promo") ||
        q.includes("coupon") ||
        q.includes("offer") ||
        q.includes("bloom10") ||
        q.includes("sale") ||
        q.includes("save") ||
        q.includes("voucher") ||
        q.includes("percent") ||
        q.includes("10%")
    ) {
        return {
            text: "A little luxury for you! You can use code **BLOOM10** at checkout for **10% off** your entire order. It applies automatically to all our Cambodian botanicals and Korean skincare favorites.",
            action: {
                type: "discount",
                code: "BLOOM10",
                label: "Apply Code: BLOOM10",
            },
        };
    }

    // 1B. Cambodian Local Botanicals & Heritage
    if (
        q.includes("cambodia") ||
        q.includes("khmer") ||
        q.includes("local") ||
        q.includes("lotus") ||
        q.includes("angkor") ||
        q.includes("kampot") ||
        q.includes("mondulkiri") ||
        q.includes("phka rumduol") ||
        q.includes("jasmine rice")
    ) {
        const cambodianProducts = catalog.filter((p) => p.origin === "Cambodian Botanical");
        return {
            text: "We are honored to celebrate authentic **Cambodian botanical heritage**! Sourced from across the Kingdom: hand-harvested pink lotus from Banteay Srei, organic Battambang jasmine rice bran, raw Mondulkiri forest honey, and GI Kampot white pepper:",
            products: cambodianProducts.length > 0 ? cambodianProducts.slice(0, 4) : catalog.filter((p) => [7, 8, 9, 10].includes(p.id)),
        };
    }

    // 1C. Korean Skincare (K-Beauty) Overview
    if (
        q.includes("korean") ||
        q.includes("k-beauty") ||
        q.includes("korea") ||
        q.includes("glass skin")
    ) {
        const kProducts = catalog.filter((p) => p.origin === "Korean Skincare");
        return {
            text: "We carry Korea's most beloved holy grail skincare brands! Discover Hanbang formulas from **Beauty of Joseon**, redness-soothing heartleaf from **Anua**, pure antioxidants from **Mary & May**, and viral icons from **Skin1004**, **Round Lab**, and **COSRX**:",
            products: kProducts.length > 0 ? kProducts.slice(0, 4) : catalog.filter((p) => [13, 14, 17, 25].includes(p.id)),
        };
    }

    // 1D. Beauty of Joseon
    if (q.includes("joseon") || q.includes("boj") || q.includes("dynasty") || q.includes("relief sun")) {
        const bojProducts = catalog.filter((p) => p.brand === "Beauty of Joseon");
        return {
            text: "**Beauty of Joseon** reinterprets timeless Hanbang herbal remedies for modern skin. Featuring nourishing rice extract, revitalizing Korean ginseng, and soothing propolis:",
            products: bojProducts.length > 0 ? bojProducts : catalog.filter((p) => [13, 14, 15, 16].includes(p.id)),
        };
    }

    // 1E. Anua
    if (q.includes("anua") || q.includes("heartleaf")) {
        const anuaProducts = catalog.filter((p) => p.brand === "Anua");
        return {
            text: "**Anua** is Korea's #1 soothing authority! Known for their calming Heartleaf 77% toner, pore control cleansing oil, deep cleansing foam, and targeted dark spot serums:",
            products: anuaProducts.length > 0 ? anuaProducts.slice(0, 4) : catalog.filter((p) => [17, 18, 19, 38].includes(p.id)),
        };
    }

    // 1F. Mary & May
    if (q.includes("mary") || q.includes("idebenone") || q.includes("blackberry") || q.includes("peptide")) {
        const mmProducts = catalog.filter((p) => p.brand === "Mary & May");
        return {
            text: "**Mary & May** is an honest Korean clean beauty brand featuring potent, transparent active ingredients and gentle EWG Green certified formulas:",
            products: mmProducts.length > 0 ? mmProducts.slice(0, 4) : catalog.filter((p) => [20, 21, 33, 34].includes(p.id)),
        };
    }

    // 1F2. Skin1004 (Madagascar Centella)
    if (q.includes("skin1004") || q.includes("centella") || q.includes("madagascar") || q.includes("ampoule") || q.includes("probio")) {
        const s1004Products = catalog.filter((p) => p.brand === "Skin1004");
        return {
            text: "**Skin1004** harnesses the raw healing powers of 100% pure Madagascar Centella Asiatica! Renowned for soothing barrier repair, pore refining, and lightweight sun care:",
            products: s1004Products.length > 0 ? s1004Products.slice(0, 4) : catalog.filter((p) => [23, 26, 28, 29].includes(p.id)),
        };
    }

    // 1G. Sunscreens & SPF50+ Protection
    if (
        q.includes("sun") ||
        q.includes("spf") ||
        q.includes("uv") ||
        q.includes("screen")
    ) {
        const spfProducts = catalog.filter((p) => p.category === "Sun Protection");
        return {
            text: "Daily SPF is the ultimate secret to spot-free, youthful skin! Our viral Korean sunscreens absorb with **zero white cast, zero stickiness**, and high broad-spectrum **SPF50+ PA++++** protection:",
            products: spfProducts.length > 0 ? spfProducts : catalog.filter((p) => [13, 24, 22].includes(p.id)),
        };
    }

    // 1H. Dark Spots, Hyperpigmentation & Brightening
    if (
        q.includes("dark spot") ||
        q.includes("hyperpigmentation") ||
        q.includes("scar") ||
        q.includes("niacinamide") ||
        q.includes("brighten") ||
        q.includes("txa")
    ) {
        const spotProducts = catalog.filter((p) => [19, 14, 20, 25].includes(p.id));
        return {
            text: "To fade post-acne marks, sun spots, and uneven pigmentation, we recommend gentle yet potent brightening actives like Niacinamide, Tranexamic Acid, and Rice ferments:",
            products: spotProducts.length > 0 ? spotProducts : catalog.slice(0, 3),
        };
    }

    // 1I. Double Cleansing, Blackheads & Pores
    if (
        q.includes("double cleanse") ||
        q.includes("blackhead") ||
        q.includes("oil cleanse") ||
        q.includes("pore")
    ) {
        const cleanseProducts = catalog.filter((p) => [8, 18, 9, 2].includes(p.id));
        return {
            text: "The gold standard for clean pores and zero breakouts is the **Double Cleanse Method**:\n\n1. **Oil Cleanse**: Melt waterproof SPF & sebum with rice bran or heartleaf oil.\n2. **Gentle Second Cleanse**: Wash with a gentle water-based milk cleanser.\n3. **Weekly Detox**: Purify with Kampot pepper clay mask.",
            products: cleanseProducts.length > 0 ? cleanseProducts : catalog.slice(0, 3),
        };
    }

    // 2. Dry / Dehydrated Skin
    if (
        q.includes("dry") ||
        q.includes("dehydrat") ||
        q.includes("flak") ||
        q.includes("tight") ||
        q.includes("moisture barrier")
    ) {
        const dryProducts = catalog.filter((p) => [1, 3, 6].includes(p.id));
        return {
            text: "For dry or thirsty skin, deep barrier hydration is essential. We recommend flooding skin with hyaluronic moisture, then sealing it with comforting botanicals:",
            products: dryProducts.length > 0 ? dryProducts : catalog.slice(0, 2),
        };
    }

    // 3. Sensitive / Redness / Calming
    if (
        q.includes("sensitiv") ||
        q.includes("redness") ||
        q.includes("calm") ||
        q.includes("irritat") ||
        q.includes("gentle") ||
        q.includes("rosacea")
    ) {
        const sensitiveProducts = catalog.filter((p) => [2, 5, 3].includes(p.id));
        return {
            text: "Sensitive skin needs peace, not harsh actives. Our gentle botanical formulas soothe redness and comfort skin without any tight or stripping feeling:",
            products: sensitiveProducts.length > 0 ? sensitiveProducts : catalog.slice(0, 2),
        };
    }

    // 4. Oily / Acne / Breakouts
    if (
        q.includes("oil") ||
        q.includes("acne") ||
        q.includes("breakout") ||
        q.includes("blemish") ||
        q.includes("pore") ||
        q.includes("sebum")
    ) {
        const oilyProducts = catalog.filter((p) => [2, 1, 5].includes(p.id));
        return {
            text: "For oily or breakout-prone skin, lightweight, non-comedogenic hydration is key. Over-stripping causes excess oil, so balance is your best friend:",
            products: oilyProducts.length > 0 ? oilyProducts : catalog.slice(0, 2),
        };
    }

    // 5. Glow / Dullness / Fatigue
    if (
        q.includes("glow") ||
        q.includes("dull") ||
        q.includes("bright") ||
        q.includes("radiant") ||
        q.includes("tired") ||
        q.includes("luminous")
    ) {
        const glowProducts = catalog.filter((p) => [1, 4].includes(p.id));
        return {
            text: "To restore that rested, radiant 'just came from a garden spa' glow, these botanical favorites flood skin with dewy light:",
            products: glowProducts.length > 0 ? glowProducts : catalog.slice(0, 2),
        };
    }

    // 6. Morning Routine
    if (q.includes("morning") || q.includes("am routine") || q.includes("day routine") || q.includes("wake up")) {
        const amProducts = catalog.filter((p) => [2, 1, 3].includes(p.id));
        return {
            text: "Here is our signature 3-minute morning ritual:\n\n1. **Cleanse**: Cloud Milk Cleanser for a soft, comforting morning refresh.\n2. **Hydrate**: Dew Drop Serum onto damp skin for bouncy plumpness.\n3. **Comfort**: Petal Soft Moisturizer to protect and nourish all day.",
            products: amProducts,
        };
    }

    // 7. Evening / Bedtime Routine
    if (q.includes("night") || q.includes("evening") || q.includes("pm routine") || q.includes("bedtime") || q.includes("sleep")) {
        const pmProducts = catalog.filter((p) => [2, 4, 10, 15].includes(p.id));
        return {
            text: "Our evening wind-down ritual lets skin deeply repair while you rest:\n\n1. **Cleanse**: Melt away daily buildup & fatigue with Cloud Milk Cleanser.\n2. **Replenish**: Green Garden Face Oil to nourish deeply.\n3. **Cushion & Seal**: Mondulkiri Honey Barrier Balm or Dynasty Cream for overnight restorative comfort.",
            products: pmProducts.length > 0 ? pmProducts : catalog.slice(0, 3),
        };
    }

    // 8. Specific Product: Dew Drop Serum
    if (q.includes("dew drop") || (q.includes("serum") && !q.includes("oil"))) {
        const item = catalog.find((p) => p.id === 1) || catalog[0];
        return {
            text: "**Dew Drop Serum** is our bestselling hydration hero. It absorbs weightlessly, plumps fine lines with plant hyaluronic acid, and leaves an ethereal dewy glow.",
            products: [item],
        };
    }

    // 9. Specific Product: Cloud Milk Cleanser
    if (q.includes("cloud milk") || q.includes("cleanser") || q.includes("wash")) {
        const item = catalog.find((p) => p.id === 2) || catalog[1];
        return {
            text: "**Cloud Milk Cleanser** is a velvety, non-foaming daily wash. It cleanses deeply while preserving your skin's protective lipid barrier.",
            products: [item],
        };
    }

    // 10. Specific Product: Petal Soft Moisturizer
    if (q.includes("petal soft") || q.includes("moisturizer") || q.includes("cream")) {
        const item = catalog.find((p) => p.id === 3) || catalog[2];
        return {
            text: "**Petal Soft Moisturizer** provides all-day velvety softness without feeling heavy or greasy. Ideal under makeup or as a standalone daily shield.",
            products: [item],
        };
    }

    // 11. Specific Product: Green Garden Face Oil
    if (q.includes("green garden") || q.includes("face oil") || q.includes("oil")) {
        const item = catalog.find((p) => p.id === 4) || catalog[3];
        return {
            text: "**Green Garden Face Oil** is a precious blend of cold-pressed botanicals that locks in moisture and revitalizes tired skin with essential fatty acids.",
            products: [item],
        };
    }

    // 12. Specific Product: Rosewater Mist
    if (q.includes("rosewater") || q.includes("mist") || q.includes("spray")) {
        const item = catalog.find((p) => p.id === 5) || catalog[4];
        return {
            text: "**Rosewater Mist** is an instant botanical reset. Spray between routine steps, over makeup, or whenever your skin needs a fresh, calming breath.",
            products: [item],
        };
    }

    // 13. Specific Product: Mondulkiri Wild Forest Honey Barrier Balm
    if (q.includes("honey") || q.includes("balm") || q.includes("barrier") || q.includes("mondulkiri")) {
        const item = catalog.find((p) => p.id === 10) || catalog[0];
        return {
            text: "**Mondulkiri Wild Forest Honey Barrier Balm** is an intensive rescue balm hand-harvested from protected Cambodian rainforests. It soothes dry skin, repairs the barrier, and locks in deep overnight moisture.",
            products: [item],
        };
    }

    // 14. Shipping, Delivery & Tracking
    if (
        q.includes("shipping") ||
        q.includes("delivery") ||
        q.includes("track") ||
        q.includes("order") ||
        q.includes("return") ||
        q.includes("refund") ||
        q.includes("policy")
    ) {
        return {
            text: "**Shipping & Delivery:**\n• Free standard delivery on orders over $50\n• Dispatches within 24–48 hours (3–5 business days delivery)\n• 30-Day Botanical Happiness Guarantee with hassle-free returns\n\nYou can view and track your orders anytime in your customer account.",
            action: {
                type: "link",
                url: "/account",
                label: "Go to Account & Orders ↗",
            },
        };
    }

    // 15. Greetings
    if (q.includes("hi") || q.includes("hello") || q.includes("hey") || q.includes("good morning") || q.includes("good afternoon")) {
        return {
            text: "Hello radiant soul. Welcome to Floralyn Skin. I'm Flora, your botanical skincare guide. How can I pamper your skin routine today?",
        };
    }

    // 16. Best sellers / general recommendation
    if (q.includes("popular") || q.includes("bestseller") || q.includes("recommend") || q.includes("best") || q.includes("favorite")) {
        return {
            text: "Here are our customer-beloved signature essentials. They form the foundation of our daily botanical moment of calm:",
            products: catalog.slice(0, 3),
        };
    }

    // 17. Thank you
    if (q.includes("thank") || q.includes("thanks") || q.includes("awesome") || q.includes("helpful")) {
        return {
            text: "You are so welcome! Wishing you a peaceful day and beautifully rested skin. Let me know whenever you need another botanical tip.",
        };
    }

    // Fallback response with helpful prompt
    return {
        text: "I'd love to help you find your skin's new happy place! Tell me a little about your skin (is it dry, sensitive, oily, or combination?) or let me know what product you'd like to explore.",
        products: catalog.slice(0, 2),
    };
}

export default function Chatbot() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(1);
    const [addedNotice, setAddedNotice] = useState<number | null>(null);
    const [copiedCode, setCopiedCode] = useState(false);
    const [showWelcomeCallout, setShowWelcomeCallout] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting on first mount
    useEffect(() => {
        const welcomeMessage: ChatMessage = {
            id: "welcome-1",
            sender: "bot",
            text: "Hello, lovely! I'm Flora, your botanical skincare advisor. How can I help your skin bloom naturally today?",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages([welcomeMessage]);
    }, []);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isTyping, isOpen]);

    function handleToggleOpen() {
        setIsOpen((prev) => {
            const next = !prev;
            if (next) {
                setUnreadCount(0);
                setShowWelcomeCallout(false);
            }
            return next;
        });
    }

    function handleSendMessage(textToSend?: string) {
        const text = (textToSend || input).trim();
        if (!text) return;

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            sender: "user",
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate intelligent botanical thinking
        setTimeout(() => {
            const reply = getBotReply(text, products);
            const botMsg: ChatMessage = {
                id: `bot-${Date.now()}`,
                sender: "bot",
                text: reply.text,
                products: reply.products,
                action: reply.action,
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            };
            setIsTyping(false);
            setMessages((prev) => [...prev, botMsg]);
        }, 650);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        handleSendMessage();
    }

    function handleAddToCart(product: Product) {
        addToCart(product.id);
        setAddedNotice(product.id);
        setTimeout(() => setAddedNotice(null), 2000);
    }

    function handleCopyDiscount(code: string) {
        saveAppliedPromo({
            code,
            name: "Flora VIP 10% Off",
            discountCents: 0,
            message: `${code} applied! 10% discount ready at checkout.`,
        });
        navigator.clipboard?.writeText(code).then(() => {
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2400);
        });
    }

    function handleClearChat() {
        setMessages([
            {
                id: `welcome-${Date.now()}`,
                sender: "bot",
                text: "Chat refreshed. What would you like to explore next?",
                timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
        ]);
    }

    if (pathname?.startsWith("/admin")) {
        return null;
    }

    return (
        <aside
            className="chatbot-root"
            aria-label="Botanical Skincare Advisor"
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                zIndex: 999999,
                display: "block",
            }}
        >
            {/* Floating Welcome Speech Bubble Callout */}
            {!isOpen && showWelcomeCallout && (
                <div
                    className="chatbot-welcome-callout"
                    onClick={handleToggleOpen}
                    role="button"
                    tabIndex={0}
                    aria-label="Click to open skincare chatbot"
                >
                    <span className="callout-sparkle"><ChatBubbleIcon size={15} /></span>
                    <div>
                        <strong>Skincare Chatbot</strong>
                        <p>Hi! Need personalized routine advice or a 10% coupon? Click to chat with Flora!</p>
                    </div>
                    <button
                        type="button"
                        className="callout-close-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowWelcomeCallout(false);
                        }}
                        aria-label="Dismiss chatbot hint"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Floating Chat Launcher Button */}
            {!isOpen && (
                <button
                    type="button"
                    className="chatbot-launcher"
                    onClick={handleToggleOpen}
                    aria-label="Open AI Skincare Chatbot"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        cursor: "pointer",
                    }}
                >
                    <div className="launcher-avatar-wrap">
                        <span className="launcher-chat-icon"><ChatBubbleIcon size={16} /></span>
                        <span className="launcher-pulse-ring" />
                    </div>
                    <div className="launcher-text">
                        <strong>Chatbot · Ask Flora</strong>
                        <small>AI Skincare Advisor</small>
                    </div>
                    <span className="launcher-online-pill">Online</span>
                    {unreadCount > 0 && <span className="launcher-badge">{unreadCount}</span>}
                </button>
            )}

            {/* Chatbot Window */}
            {isOpen && (
                <div className="chatbot-window" role="dialog" aria-modal="true" aria-label="Floralyn Skincare Assistant">
                    {/* Header */}
                    <header className="chat-header">
                        <div className="chat-header-info">
                            <div className="chat-avatar">
                                <span><ChatBubbleIcon size={16} /></span>
                                <span className="chat-status-dot" />
                            </div>
                            <div>
                                <h3>Flora · AI Skincare Chatbot</h3>
                                <p className="chat-subtitle">Botanical Ritual Advisor · Online 24/7</p>
                            </div>
                        </div>
                        <div className="chat-header-actions">
                            <button
                                type="button"
                                className="chat-action-btn"
                                onClick={handleClearChat}
                                title="Clear conversation"
                                aria-label="Clear chat conversation"
                            >
                                ↺
                            </button>
                            <button
                                type="button"
                                className="chat-action-btn close"
                                onClick={handleToggleOpen}
                                title="Close chat"
                                aria-label="Close chat window"
                            >
                                ✕
                            </button>
                        </div>
                    </header>

                    {/* Messages Body */}
                    <div className="chat-body" tabIndex={0} aria-label="Chat messages history">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`chat-message-row ${msg.sender === "user" ? "user-row" : "bot-row"}`}
                            >
                                {msg.sender === "bot" && (
                                    <div className="msg-bot-avatar" aria-hidden="true">
                                        <BotanicalAvatarIcon size={13} />
                                    </div>
                                )}

                                <div className="chat-bubble-container">
                                    <div className={`chat-bubble ${msg.sender}`}>
                                        <p className="msg-text">{msg.text}</p>
                                    </div>

                                    {/* Action button if discount or link */}
                                    {msg.action && (
                                        <div className="chat-action-card">
                                            {msg.action.type === "discount" && msg.action.code && (
                                                <button
                                                    type="button"
                                                    className="discount-copy-btn"
                                                    onClick={() => handleCopyDiscount(msg.action?.code || "BLOOM10")}
                                                >
                                                    <span className="code-tag">{msg.action.code}</span>
                                                    <span>{copiedCode ? "Applied to Bag!" : "Apply Code (10% Off)"}</span>
                                                </button>
                                            )}
                                            {msg.action.type === "link" && msg.action.url && (
                                                <Link href={msg.action.url} className="chat-link-btn">
                                                    {msg.action.label || "Learn more ↗"}
                                                </Link>
                                            )}
                                        </div>
                                    )}

                                    {/* Recommended Product Cards */}
                                    {msg.products && msg.products.length > 0 && (
                                        <div className="chat-product-list">
                                            {msg.products.map((product) => (
                                                <article key={product.id} className="chat-product-card">
                                                    <Link href={`/product/${product.id}`} className="chat-product-thumb">
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            width={54}
                                                            height={54}
                                                            className="chat-thumb-img"
                                                        />
                                                    </Link>
                                                    <div className="chat-product-details">
                                                        <span className="chat-product-cat">{product.brand ? `${product.brand} · ${product.category}` : product.category}</span>
                                                        <Link href={`/product/${product.id}`} className="chat-product-name" title="Click to view details & price">
                                                            {product.name}
                                                        </Link>
                                                        <div className="chat-product-meta">
                                                            <span className="chat-product-role" title={product.role || product.tag}>{product.role || product.tag || "Botanical Ritual"}</span>
                                                            <span className="chat-rating">4.9 / 5.0</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={`chat-add-btn ${addedNotice === product.id ? "added" : ""}`}
                                                        onClick={() => handleAddToCart(product)}
                                                        aria-label={`Add ${product.name} to cart`}
                                                    >
                                                        {addedNotice === product.id ? "Added" : "+ Add"}
                                                    </button>
                                                </article>
                                            ))}
                                        </div>
                                    )}

                                    <span className="msg-timestamp">{msg.timestamp}</span>
                                </div>
                            </div>
                        ))}

                        {/* Typing animation indicator */}
                        {isTyping && (
                            <div className="chat-message-row bot-row">
                                <div className="msg-bot-avatar" aria-hidden="true">
                                    <BotanicalAvatarIcon size={13} />
                                </div>
                                <div className="chat-bubble bot typing-bubble">
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="chat-suggestions-bar" role="group" aria-label="Suggested skincare questions">
                        {INITIAL_SUGGESTIONS.map((sug, i) => (
                            <button
                                key={i}
                                type="button"
                                className="suggestion-chip"
                                onClick={() => handleSendMessage(sug.query)}
                            >
                                {sug.label}
                            </button>
                        ))}
                    </div>

                    {/* Chat Input Bar */}
                    <form className="chat-input-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask Flora about your skin, routine..."
                            className="chat-input"
                            aria-label="Ask skincare questions"
                        />
                        <button
                            type="submit"
                            className="chat-send-btn"
                            disabled={!input.trim()}
                            aria-label="Send message"
                        >
                            <span>↗</span>
                        </button>
                    </form>
                </div>
            )}
        </aside>
    );
}
