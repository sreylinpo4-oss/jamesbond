import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";

async function AccountDetails() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <>
      <div className="account-header">
        <span className="eyebrow">CUSTOMER PROFILE</span>
        <h1>Welcome, {profile?.display_name || profile?.username || "Beauty"}</h1>
        <p>Manage your Floralyn account details and orders.</p>
      </div>

      <div className="account-grid">
        <div className="account-card">
          <h3>Profile Details</h3>
          <div className="detail-item">
            <span className="detail-label">Username</span>
            <strong className="detail-value">
              @{profile?.username || "Not set"}
            </strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">Email</span>
            <strong className="detail-value">{user.email}</strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">Account Tier</span>
            <span className="tier-badge">
              {profile?.role === "admin" ? "Administrator" : "Floralyn Member"}
            </span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Member Since</span>
            <span className="detail-value">{joinedDate}</span>
          </div>

          <form action={signOutAction} className="sign-out-form">
            <button type="submit" className="outline-button sign-out-btn">
              Sign Out
            </button>
          </form>
        </div>

        <div className="account-card">
          <h3>Recent Orders</h3>
          <div className="orders-empty">
            <p>You have no recent orders.</p>
            <Link href="/#shop" className="primary-button shop-now-btn">
              Discover Skincare →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AccountPage() {
  return (
    <main className="account-page">
      <header className="navbar">
        <Link href="/" className="logo">
          ✿ Floralyn Skin
        </Link>
        <nav>
          <Link href="/#home">Home</Link>
          <Link href="/#shop">Shop</Link>
          <Link href="/account" className="active-nav">
            My Account
          </Link>
        </nav>
        <Link className="bag" href="/#cart">
          ♡ Bag
        </Link>
      </header>

      <div className="account-container">
        <Suspense fallback={<div className="auth-loading">Loading account details...</div>}>
          <AccountDetails />
        </Suspense>
      </div>
    </main>
  );
}
