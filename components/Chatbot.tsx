"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { addToCart } from "@/lib/cart";
import { saveAppliedPromo } from "@/lib/discounts";
import { products, type Product } from "@/lib/products";
import {
  getFloraReply,
  analyzeUploadedSkinPhoto,
  buildPersonalizedRoutine,
  DEFAULT_SUGGESTIONS,
  type BotResponse,
  type SkinScanReport,
  type CompleteRoutine,
  type SkinType,
} from "@/lib/chatbot-ai";

export type ChatMessage = {
  id: string;
  sender: "bot" | "user";
  text: string;
  photoUrl?: string;
  products?: Product[];
  routine?: CompleteRoutine;
  scanReport?: SkinScanReport;
  medicalAlert?: BotResponse["medicalAlert"];
  quizStep?: BotResponse["quizStep"];
  action?: BotResponse["action"];
  suggestions?: { label: string; query: string }[];
  timestamp: string;
};

type StoredProfile = {
  skinType?: SkinType;
  concerns?: string[];
  scans?: SkinScanReport[];
  lastUpdated?: string;
};

const STORAGE_KEY = "floralyn_bot_profile";

export default function Chatbot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [addedNotice, setAddedNotice] = useState<number | string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showWelcomeCallout, setShowWelcomeCallout] = useState(true);
  const [currentSuggestions, setCurrentSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const [userProfile, setUserProfile] = useState<StoredProfile | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [routineTabs, setRoutineTabs] = useState<Record<string, "AM" | "PM">>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Load long-term profile memory on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredProfile;
        setUserProfile(parsed);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // 2. Initial greeting with personalization if memory exists
  useEffect(() => {
    let welcomeText =
      "Hello radiant soul 🌿 I'm Flora, your AI Skincare Aesthetician & Botanical Advisor.\n\nI can guide you through our **60s Skin Diagnostic Quiz**, scan your skin photo with computer vision, build customized AM/PM routines, or check ingredient safety! How can I pamper your skin today?";

    if (userProfile?.skinType) {
      welcomeText = `Welcome back! 🌿 I remember your skin profile is **${userProfile.skinType.toUpperCase()}** ${
        userProfile.scans?.length ? `(with ${userProfile.scans.length} skin scan logged)` : ""
      }.\n\nWould you like to check in on your skin progress, scan a new photo, or update your routine today?`;
    }

    const welcomeMessage: ChatMessage = {
      id: "welcome-1",
      sender: "bot",
      text: welcomeText,
      suggestions: userProfile?.skinType
        ? [
            { label: "📊 View My Skin Progress", query: "view my skin progress" },
            { label: "📸 New AI Selfie Skin Scan", query: "scan my skin photo" },
            { label: "🔄 Retake Skin Quiz", query: "start skin quiz" },
            { label: "🎁 10% Discount Code", query: "Do you have a discount code?" },
          ]
        : DEFAULT_SUGGESTIONS.slice(0, 4),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages([welcomeMessage]);
  }, [userProfile?.skinType, userProfile?.scans?.length]);

  // 3. Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, isAnalyzingPhoto]);

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

  function saveProfileToStorage(updated: StoredProfile) {
    setUserProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage quota or disabled
    }
  }

  function handleClearMemory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setUserProfile(null);
    setMessages([
      {
        id: `reset-${Date.now()}`,
        sender: "bot",
        text: "Skin memory cleared! 🌿 Let's start fresh. Click below to take your 60-second skin diagnostic quiz:",
        suggestions: [
          { label: "🌟 Take 60s Skin Diagnostic Quiz", query: "start skin quiz" },
          { label: "📸 AI Selfie Skin Scan", query: "scan my skin photo" },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }

  // Handle Freeform and Quick Reply message sending
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

    // Check if user requested to view progress
    if (text.toLowerCase().includes("view my skin progress") || text.toLowerCase().includes("skin progress")) {
      setTimeout(() => {
        setIsTyping(false);
        const scans = userProfile?.scans || [];
        if (scans.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: "bot",
              text: "You haven't logged any skin scans yet! 📸 Click the camera icon or button below to upload your first baseline photo and track your skin's transformation over time.",
              action: { type: "scan", label: "📸 Upload Baseline Photo" },
              suggestions: [{ label: "📸 Upload Selfie Skin Scan", query: "scan my skin photo" }],
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
          return;
        }

        const latestScan = scans[scans.length - 1];
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: `📊 **Your Skin Evolution Journal**\n\nTotal scans on file: **${scans.length}**\nBaseline Skin Profile: **${userProfile?.skinType?.toUpperCase() || "COMBINATION"}**\nLatest Hydration: **${latestScan.hydrationScore}%** · Redness Score: **${latestScan.rednessScore}%**\n\nHere is your latest computer vision diagnostic breakdown:`,
            scanReport: latestScan,
            suggestions: [
              { label: "📸 Log New Follow-Up Scan", query: "scan my skin photo" },
              { label: "🧴 Refresh My Custom Routine", query: "build my personalized routine" },
            ],
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }, 500);
      return;
    }

    // Process botanical consultation
    setTimeout(() => {
      const reply = getFloraReply(text, products, {
        skinType: userProfile?.skinType,
      });

      // If routine was generated or quiz completed, save to profile memory
      if (reply.routine) {
        const updatedProfile: StoredProfile = {
          ...userProfile,
          skinType: reply.routine.skinType,
          lastUpdated: new Date().toISOString(),
        };
        saveProfileToStorage(updatedProfile);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: reply.text,
        products: reply.products,
        routine: reply.routine,
        medicalAlert: reply.medicalAlert,
        quizStep: reply.quizStep,
        action: reply.action,
        suggestions: reply.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      if (reply.suggestions && reply.suggestions.length > 0) {
        setCurrentSuggestions(reply.suggestions);
      }

      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 600);
  }

  // Handle Photo Upload & Computer Vision Simulation
  function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Add user photo message
      const userPhotoMsg: ChatMessage = {
        id: `user-photo-${Date.now()}`,
        sender: "user",
        text: "Uploaded skin photo for AI computer vision scan 📸",
        photoUrl: dataUrl,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userPhotoMsg]);
      setIsAnalyzingPhoto(true);

      // Simulate vision processing pipeline
      setTimeout(() => {
        const scanReport = analyzeUploadedSkinPhoto(dataUrl, input);
        const autoRoutine = buildPersonalizedRoutine(scanReport.skinType, "barrier_repair", products);

        // Save scan to profile history
        const updatedProfile: StoredProfile = {
          ...userProfile,
          skinType: scanReport.skinType,
          scans: [...(userProfile?.scans || []), scanReport],
          lastUpdated: new Date().toISOString(),
        };
        saveProfileToStorage(updatedProfile);

        setIsAnalyzingPhoto(false);

        const botScanMsg: ChatMessage = {
          id: `bot-scan-${Date.now()}`,
          sender: "bot",
          text: `🔬 **AI Skin Analysis Complete!**\n\nFlora's vision scanner classified your dermal signature as **${scanReport.skinType.toUpperCase()} SKIN**.\n\n**Primary Focus**: *${scanReport.recommendedFocus}*\n\nReview your clinical score gauges below:`,
          scanReport,
          routine: autoRoutine,
          products: autoRoutine.allProducts,
          action: {
            type: "add_routine",
            label: `🛍️ Add Prescribed ${scanReport.skinType.toUpperCase()} Routine to Bag`,
            productIds: autoRoutine.allProducts.map((p) => p.id),
          },
          suggestions: [
            { label: "🌿 Make it a 3-Step Minimalist", query: `make routine minimalist ${scanReport.skinType}` },
            { label: "🧪 Active Ingredient Check", query: "Can I use Retinol with AHA BHA?" },
            { label: "🎁 10% Discount Code", query: "Do you have a discount code?" },
          ],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setMessages((prev) => [...prev, botScanMsg]);
      }, 1600);
    };

    reader.readAsDataURL(file);
    // Reset file input value
    e.target.value = "";
  }

  function handleBatchAddRoutine(productIds: number[]) {
    productIds.forEach((id) => addToCart(id));
    setAddedNotice("all");
    setTimeout(() => setAddedNotice(null), 2500);
  }

  function handleAddSingleProduct(product: Product) {
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSendMessage();
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
      {/* Hidden File Picker for AI Skin Vision Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoUpload}
        accept="image/*"
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {/* Floating Welcome Speech Bubble Callout */}
      {!isOpen && showWelcomeCallout && (
        <div
          className="chatbot-welcome-callout"
          onClick={handleToggleOpen}
          role="button"
          tabIndex={0}
          aria-label="Click to open skincare chatbot"
        >
          <span className="callout-sparkle">💬</span>
          <div>
            <strong>Flora · AI Skincare Advisor</strong>
            <p>
              {userProfile?.skinType
                ? `Welcome back! Your ${userProfile.skinType.toUpperCase()} routine & progress scan are ready.`
                : "Need a 60s skin quiz, AI selfie scan, or 10% off coupon? Chat with Flora!"}
            </p>
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
        >
          <div className="launcher-avatar-wrap">
            <span className="launcher-chat-icon">💬</span>
            <span className="launcher-pulse-ring" />
          </div>
          <div className="launcher-text">
            <strong>Chatbot · Ask Flora</strong>
            <small>
              {userProfile?.skinType
                ? `Saved: ${userProfile.skinType.toUpperCase()} Skin`
                : "AI Skin Quiz & Vision Scan"}
            </small>
          </div>
          <span className="launcher-online-pill">Online</span>
          {unreadCount > 0 && <span className="launcher-badge">{unreadCount}</span>}
        </button>
      )}

      {/* Chatbot Window */}
      {isOpen && (
        <div
          className="chatbot-window"
          role="dialog"
          aria-modal="true"
          aria-label="Floralyn Skincare Assistant"
        >
          {/* Header */}
          <header className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <span>💬</span>
                <span className="chat-status-dot" />
              </div>
              <div>
                <h3>Flora · AI Skincare Advisor</h3>
                <p className="chat-subtitle">Diagnostic Quiz &amp; Computer Vision · 24/7</p>
              </div>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                className="chat-action-btn"
                onClick={() => {
                  setMessages([]);
                  handleSendMessage("start skin quiz");
                }}
                title="Restart diagnostic quiz"
                aria-label="Restart skin diagnostic quiz"
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

          {/* Long-Term Memory Profile Status Bar */}
          {userProfile?.skinType && (
            <div className="chat-memory-banner">
              <span className="memory-pill">
                🌿 Profile: <strong>{userProfile.skinType.toUpperCase()}</strong>
                {userProfile.scans?.length ? ` · ${userProfile.scans.length} Scan(s)` : ""}
              </span>
              <button
                type="button"
                className="memory-reset-btn"
                onClick={handleClearMemory}
                title="Reset saved skin type and scan memory"
              >
                Reset memory
              </button>
            </div>
          )}

          {/* Messages Body */}
          <div className="chat-body" tabIndex={0} aria-label="Chat messages history">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message-row ${msg.sender === "user" ? "user-row" : "bot-row"}`}
              >
                {msg.sender === "bot" && (
                  <div className="msg-bot-avatar" aria-hidden="true">
                    ✿
                  </div>
                )}

                <div className="chat-bubble-container">
                  {/* Photo Display if user uploaded an image */}
                  {msg.photoUrl && (
                    <div
                      style={{
                        borderRadius: "12px",
                        overflow: "hidden",
                        marginBottom: "8px",
                        maxWidth: "200px",
                        border: "1px solid rgba(135, 151, 125, 0.4)",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.photoUrl}
                        alt="Uploaded skin photo"
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                    </div>
                  )}

                  {/* Standard Text Bubble */}
                  <div className={`chat-bubble ${msg.sender}`}>
                    <p className="msg-text" style={{ whiteSpace: "pre-line" }}>
                      {msg.text}
                    </p>
                  </div>

                  {/* Medical Triage Alert Card */}
                  {msg.medicalAlert && (
                    <div className="chat-medical-alert" role="alert">
                      <div className="alert-title-row">
                        <span>🚨</span>
                        <strong>{msg.medicalAlert.condition}</strong>
                      </div>
                      <p style={{ margin: "4px 0 8px" }}>{msg.medicalAlert.guidance}</p>
                      {msg.medicalAlert.escalationUrl && (
                        <a
                          href={msg.medicalAlert.escalationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            background: "#a83820",
                            color: "#fff",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "10.5px",
                            fontWeight: 700,
                            textDecoration: "none",
                          }}
                        >
                          Chat with Support on Telegram ↗
                        </a>
                      )}
                    </div>
                  )}

                  {/* Interactive Quick-Reply Quiz Step Box */}
                  {msg.quizStep && (
                    <div className="chat-quiz-box">
                      <div className="quiz-header">
                        <span>✦</span>
                        <span>{msg.quizStep.title}</span>
                      </div>
                      <p className="quiz-question">{msg.quizStep.question}</p>
                      <div className="quiz-options-list">
                        {msg.quizStep.options.map((opt, i) => (
                          <button
                            key={i}
                            type="button"
                            className="quiz-option-btn"
                            onClick={() => handleSendMessage(opt.query)}
                          >
                            <span>{opt.label}</span>
                            <span style={{ fontSize: "12px", opacity: 0.7 }}>➔</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Computer Vision Scan Report Card */}
                  {msg.scanReport && (
                    <div className="chat-scan-card">
                      {msg.scanReport.imageUrl && (
                        <div className="scan-visual-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.scanReport.imageUrl}
                            alt="Analyzed skin area"
                            className="scan-user-image"
                          />
                          <div className="scan-laser-line" />
                          <span className="scan-badge-overlay">AI Vision Analyzed ✓</span>
                        </div>
                      )}

                      <div className="scan-details">
                        <div className="scan-title-row">
                          <strong>Dermal Diagnostic Scan</strong>
                          <span className="scan-type-pill">
                            {msg.scanReport.skinType.toUpperCase()} SKIN
                          </span>
                        </div>

                        {/* Metric Gauges */}
                        <div className="scan-metrics-grid">
                          <div className="metric-item">
                            <div className="metric-label-row">
                              <span>Hydration</span>
                              <strong>{msg.scanReport.hydrationScore}%</strong>
                            </div>
                            <div className="metric-track">
                              <div
                                className={`metric-fill ${
                                  msg.scanReport.hydrationScore > 50
                                    ? "good"
                                    : msg.scanReport.hydrationScore > 35
                                    ? "warning"
                                    : "alert"
                                }`}
                                style={{ width: `${msg.scanReport.hydrationScore}%` }}
                              />
                            </div>
                          </div>

                          <div className="metric-item">
                            <div className="metric-label-row">
                              <span>Redness Index</span>
                              <strong>{msg.scanReport.rednessScore}%</strong>
                            </div>
                            <div className="metric-track">
                              <div
                                className={`metric-fill ${
                                  msg.scanReport.rednessScore < 40
                                    ? "good"
                                    : msg.scanReport.rednessScore < 65
                                    ? "warning"
                                    : "alert"
                                }`}
                                style={{ width: `${msg.scanReport.rednessScore}%` }}
                              />
                            </div>
                          </div>

                          <div className="metric-item">
                            <div className="metric-label-row">
                              <span>Pore Sebum</span>
                              <strong>{msg.scanReport.poreScore}%</strong>
                            </div>
                            <div className="metric-track">
                              <div
                                className={`metric-fill ${
                                  msg.scanReport.poreScore < 45
                                    ? "good"
                                    : msg.scanReport.poreScore < 65
                                    ? "warning"
                                    : "alert"
                                }`}
                                style={{ width: `${msg.scanReport.poreScore}%` }}
                              />
                            </div>
                          </div>

                          <div className="metric-item">
                            <div className="metric-label-row">
                              <span>Smoothness</span>
                              <strong>{msg.scanReport.smoothnessScore}%</strong>
                            </div>
                            <div className="metric-track">
                              <div
                                className="metric-fill good"
                                style={{ width: `${msg.scanReport.smoothnessScore}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Key Findings */}
                        <strong style={{ fontSize: "11px", color: "#34483a", display: "block", marginBottom: "4px" }}>
                          Clinical Visual Observations:
                        </strong>
                        <ul className="scan-findings-list">
                          {msg.scanReport.findings.map((f, idx) => (
                            <li key={idx}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Dual AM / PM Interactive Routine Card */}
                  {msg.routine && (
                    <div className="chat-routine-box">
                      <div className="routine-header-row">
                        <strong>{msg.routine.title}</strong>
                        <span style={{ fontSize: "10px", color: "#8c6844", fontWeight: 700 }}>
                          ✦ Layered Order
                        </span>
                      </div>

                      <div className="routine-tabs-switch" role="tablist">
                        <button
                          type="button"
                          className={`routine-tab-btn ${
                            (routineTabs[msg.id] || "AM") === "AM" ? "active" : ""
                          }`}
                          onClick={() =>
                            setRoutineTabs((prev) => ({ ...prev, [msg.id]: "AM" }))
                          }
                        >
                          ☀️ Morning (AM) Steps
                        </button>
                        <button
                          type="button"
                          className={`routine-tab-btn ${
                            (routineTabs[msg.id] || "AM") === "PM" ? "active" : ""
                          }`}
                          onClick={() =>
                            setRoutineTabs((prev) => ({ ...prev, [msg.id]: "PM" }))
                          }
                        >
                          🌙 Evening (PM) Steps
                        </button>
                      </div>

                      {/* Step list for selected phase */}
                      <div className="routine-steps-list">
                        {(routineTabs[msg.id] === "PM"
                          ? msg.routine.pmSteps
                          : msg.routine.amSteps
                        ).map((stepItem) => (
                          <div key={stepItem.step} className="routine-step-card">
                            <span className="step-num-badge">{stepItem.step}</span>
                            <div className="step-content">
                              <span className="step-role-title">
                                {stepItem.role}
                              </span>
                              <Link
                                href={`/product/${stepItem.product.id}`}
                                className="step-product-link"
                                title="Click to view details and price"
                              >
                                {stepItem.product.name}
                              </Link>
                              <p className="step-usage-tip">{stepItem.usage}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Entire Routine to Bag Button */}
                      <button
                        type="button"
                        className="add-entire-routine-btn"
                        onClick={() =>
                          handleBatchAddRoutine(msg.routine!.allProducts.map((p) => p.id))
                        }
                      >
                        <span>
                          {addedNotice === "all"
                            ? "Entire Routine Added to Bag! ✓"
                            : "🛍️ Add Entire Routine to Bag"}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Single Action Button (e.g. Discount Code or Link) */}
                  {msg.action && msg.action.type === "discount" && msg.action.code && (
                    <div className="chat-action-card">
                      <button
                        type="button"
                        className="discount-copy-btn"
                        onClick={() => handleCopyDiscount(msg.action?.code || "BLOOM10")}
                      >
                        <span className="code-tag">{msg.action.code}</span>
                        <span>{copiedCode ? "Applied to Bag! ✓" : "Apply Code (10% Off)"}</span>
                      </button>
                    </div>
                  )}

                  {msg.action && msg.action.type === "scan" && (
                    <div style={{ marginTop: "8px" }}>
                      <button
                        type="button"
                        className="button button-dark"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: "100%",
                          padding: "8px 14px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        📸 Select Skin Photo / Take Selfie
                      </button>
                    </div>
                  )}

                  {/* Recommended Individual Product Cards (Prices Hidden Until Clicked) */}
                  {msg.products && !msg.routine && msg.products.length > 0 && (
                    <div className="chat-product-list">
                      {msg.products.map((product) => (
                        <article key={product.id} className="chat-product-card">
                          <Link
                            href={`/product/${product.id}`}
                            className="chat-product-thumb"
                            title="Click to view details and price"
                          >
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={54}
                              height={54}
                              className="chat-thumb-img"
                            />
                          </Link>
                          <div className="chat-product-details">
                            <span className="chat-product-cat">
                              {product.brand} · {product.category}
                            </span>
                            <Link
                              href={`/product/${product.id}`}
                              className="chat-product-name"
                              title="Click to view details and price"
                            >
                              {product.name}
                            </Link>
                            <div className="chat-product-meta">
                              <span className="chat-product-role" title={product.role}>
                                ✦ {product.role || product.tag}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className={`chat-add-btn ${
                              addedNotice === product.id ? "added" : ""
                            }`}
                            onClick={() => handleAddSingleProduct(product)}
                            aria-label={`Add ${product.name} to cart`}
                          >
                            {addedNotice === product.id ? "Added ✓" : "+ Add"}
                          </button>
                        </article>
                      ))}
                    </div>
                  )}

                  <span className="msg-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Photo Vision Scanning Animation Indicator */}
            {isAnalyzingPhoto && (
              <div className="chat-message-row bot-row">
                <div className="msg-bot-avatar" aria-hidden="true">
                  ✿
                </div>
                <div
                  className="chat-bubble bot"
                  style={{
                    background: "rgba(30, 41, 32, 0.95)",
                    color: "#76dd8d",
                    border: "1px solid #76dd8d",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <span className="launcher-flower" style={{ fontSize: "16px" }}>
                    ✳
                  </span>
                  <div>
                    <strong>Analyzing Skin Matrix...</strong>
                    <p style={{ margin: 0, fontSize: "10px", opacity: 0.85 }}>
                      Scanning hydration, surface redness &amp; pore congestion index
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Typing indicator */}
            {isTyping && !isAnalyzingPhoto && (
              <div className="chat-message-row bot-row">
                <div className="msg-bot-avatar" aria-hidden="true">
                  ✿
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

          {/* Quick Suggestion Chips */}
          <div
            className="chat-suggestions-bar"
            role="group"
            aria-label="Suggested skincare questions"
          >
            {currentSuggestions.map((sug, i) => (
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

          {/* Chat Input Bar with Camera Photo Upload Button */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <button
              type="button"
              className="chat-camera-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Upload clear selfie for AI Computer Vision skin scan"
              aria-label="Upload skin photo"
            >
              📷
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Flora: quiz, routine, photo scan..."
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
