"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";

import { addToCart } from "@/lib/cart";
import {
  clearAccountProfile,
  defaultProfile,
  demoAddresses,
  demoPaymentMethods,
  getNotificationPreferences,
  getAccountProfileSnapshot,
  parseAccountProfile,
  saveNotificationPreferences,
  subscribeAccountProfile,
  type NotificationPreference,
} from "@/lib/account";

const recentOrders = [
  {
    id: "FL-2407",
    item: "Dew Drop Serum + Rosewater Mist",
    total: "$46.00",
    status: "Preparing",
    invoice: "FL-2407-invoice.pdf",
  },
  {
    id: "FL-2389",
    item: "Petal Soft Moisturizer",
    total: "$32.00",
    status: "Shipped",
    invoice: "FL-2389-invoice.pdf",
  },
  {
    id: "FL-2352",
    item: "Cloud Milk Cleanser",
    total: "$22.00",
    status: "Delivered",
    invoice: "FL-2352-invoice.pdf",
  },
];

function downloadInvoice(orderId: string, total: string) {
  const content = `Floralyn Skin Invoice\nOrder: ${orderId}\nTotal: ${total}\nStatus: Demo invoice generated for customer account management UI.`;
  const blob = new Blob([content], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${orderId.toLowerCase()}-invoice.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AccountPage() {
  const router = useRouter();
  const profileSnapshot = useSyncExternalStore(
    subscribeAccountProfile,
    getAccountProfileSnapshot,
    () => null,
  );
  const profile = useMemo(() => parseAccountProfile(profileSnapshot), [profileSnapshot]);
  const [notifications, setNotifications] = useState<NotificationPreference[]>(getNotificationPreferences());

  const profileData = profile ?? defaultProfile;
  const welcomeName = useMemo(() => profileData.fullName.split(" ")[0] || "friend", [profileData.fullName]);

  const dashboardStats = [
    { label: "Active orders", value: "3" },
    { label: "Saved addresses", value: String(demoAddresses.length) },
    { label: "Stored methods", value: String(demoPaymentMethods.length) },
    { label: "Preferences", value: String(notifications.filter((item) => item.enabled).length) },
  ];

  function handleSignOut() {
    clearAccountProfile();
    router.push("/account/login");
  }

  function handleTogglePreference(key: NotificationPreference["key"]) {
    const next = notifications.map((item) =>
      item.key === key ? { ...item, enabled: !item.enabled } : item,
    );
    setNotifications(next);
    saveNotificationPreferences(next);
  }

  function handleReorder(item: string) {
    const productMap: Record<string, number> = {
      "Dew Drop Serum": 1,
      "Petal Soft Moisturizer": 3,
      "Cloud Milk Cleanser": 2,
      "Rosewater Mist": 5,
    };

    const productId = productMap[item.split(" + ")[0]] ?? 1;
    addToCart(productId);
    router.push("/cart");
  }

  const hasSession = Boolean(profile && profile.email && profile.email !== "");

  if (!hasSession) {
    return (
      <main className="page-shell static-page account-shell">
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
            <Link href="/cart" className="text-link">Bag</Link>
          </div>
        </header>

        <section className="account-auth-wrapper">
          <div className="auth-hero-card">
            <div className="eyebrow">CUSTOMER ACCOUNT</div>
            <h1>Take care of your ritual, all in one place.</h1>
            <p>
              Manage your orders, update delivery details, store payment methods, and stay in sync with your favorite skincare routine.
            </p>
            <div className="auth-benefits">
              <span>Order history</span>
              <span>Saved addresses</span>
              <span>Secure payment methods</span>
              <span>Notifications</span>
            </div>
          </div>

          <div className="auth-card-stack">
            <div className="auth-card">
              <div className="mini-label">Welcome back</div>
              <h2>Sign in</h2>
              <p>Login with email, phone number, or social accounts.</p>
              <Link href="/account/login" className="button button-dark">Login to your account</Link>
            </div>

            <div className="auth-card">
              <div className="mini-label">New here?</div>
              <h2>Create account</h2>
              <p>Set up your customer dashboard in minutes.</p>
              <Link href="/account/register" className="button button-ghost auth-secondary">Create account</Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell static-page account-shell">
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
          <Link href="/cart" className="text-link">Bag</Link>
          <button type="button" className="text-link button-as-link" onClick={handleSignOut}>Sign out</button>
        </div>
      </header>

      <div className="page-header-row">
        <div>
          <div className="eyebrow">MY ACCOUNT</div>
          <h1>Welcome back, {welcomeName}.</h1>
        </div>
        <Link href="/" className="text-link">Continue shopping ↗</Link>
      </div>

      <section className="metric-grid">
        {dashboardStats.map((stat) => (
          <div className="metric-card" key={stat.label}>
            <span className="metric-value">{stat.value}</span>
            <span className="metric-label">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="account-dashboard-grid">
        <div className="account-card profile-card wide-card">
          <div className="avatar-badge">{profileData.fullName.slice(0, 2).toUpperCase()}</div>
          <div>
            <div className="mini-label">Customer profile</div>
            <h2>{profileData.fullName}</h2>
            <p>{profileData.email}</p>
            <small className="subtle-text">Signed in with {profileData.provider}</small>
          </div>
        </div>

        <div className="account-card info-card">
          <div className="mini-label">Preferred ritual</div>
          <h3>Glow + hydration</h3>
          <p>Soft cleansing, a silky serum, and a rich night cream for balance and dew.</p>
        </div>

        <div className="account-card order-card wide-card">
          <div className="mini-label">Order history</div>
          <div className="order-list">
            {recentOrders.map((order) => (
              <div className="order-row" key={order.id}>
                <div>
                  <strong>{order.id}</strong>
                  <small>{order.item}</small>
                </div>
                <div className="order-meta">
                  <span>{order.total}</span>
                  <em>{order.status}</em>
                </div>
                <div className="order-actions">
                  <button type="button" className="text-link small-link" onClick={() => downloadInvoice(order.id, order.total)}>Download invoice</button>
                  <button type="button" className="button button-ghost order-button" onClick={() => handleReorder(order.item)}>Re-order</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="account-card address-card">
          <div className="mini-label">Saved addresses</div>
          <div className="stack-list">
            {demoAddresses.map((address) => (
              <div className="stack-row" key={address.id}>
                <strong>{address.label}</strong>
                <span>{address.name}</span>
                <small>
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.country} {address.postalCode}
                </small>
              </div>
            ))}
          </div>
        </div>

        <div className="account-card payment-card">
          <div className="mini-label">Stored payments</div>
          <div className="stack-list">
            {demoPaymentMethods.map((method) => (
              <div className="stack-row" key={method.id}>
                <strong>{method.label}</strong>
                <span>
                  {method.brand} •••• {method.last4}
                </span>
                <small>
                  {method.type} • Expires {method.expiry}
                </small>
              </div>
            ))}
          </div>
        </div>

        <div className="account-card notification-card">
          <div className="mini-label">Notification preferences</div>
          <div className="notification-list">
            {notifications.map((item) => (
              <label key={item.key} className="toggle-row">
                <span>{item.label}</span>
                <button
                  type="button"
                  className={item.enabled ? "switch on" : "switch"}
                  aria-label={item.label}
                  onClick={() => handleTogglePreference(item.key)}
                >
                  <span className="switch-dot" />
                </button>
              </label>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
