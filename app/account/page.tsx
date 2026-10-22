import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/auth/actions";
import ChangeEmailForm from "./ChangeEmailForm";

export const instant = false;

export default async function AccountPage() {
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

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("order_number,status,payment_status,currency,total_cents,discount_cents,discount_code,created_at,order_tracking_updates(status,location,note,created_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (ordersError) {
    console.error("Failed to load customer order history:", ordersError);
  }

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

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
        <Link className="bag" href="/cart">
          ♡ Bag
        </Link>
      </header>

      <div className="account-container">
        <div className="account-header">
          <span className="eyebrow">CUSTOMER PROFILE</span>
          <h1>Welcome, {profile?.display_name || profile?.username || "Beauty"}</h1>
          <p>Manage your Floralyn account details and orders.</p>
        </div>

        <div className="account-grid">
          <div className="account-card">
            <h3>Profile Details</h3>

            {profile?.avatar_url && (
              <div className="detail-item">
                <span className="detail-label">Avatar</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatar_url}
                  alt="Profile Avatar"
                  width={42}
                  height={42}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid #e5dfd5",
                  }}
                />
              </div>
            )}

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

            <div className="detail-item account-email-form">
              <ChangeEmailForm currentEmail={user.email || ""} />
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
            {ordersError ? (
              <p role="alert">Order history could not be loaded. Please refresh this page.</p>
            ) : orders?.length ? (
              orders.map((order) => (
                <article className="order-tracking-card" key={order.order_number}>
                  <div className="order-tracking-heading">
                    <div>
                      <strong>{order.order_number}</strong>
                      <span className="detail-label">
                        {order.status} · Payment {order.payment_status}
                        {order.discount_code ? ` · Promo ${order.discount_code}` : ""}
                      </span>
                    </div>
                    <strong className="detail-value">
                      {order.currency} {(order.total_cents / 100).toFixed(2)}
                    </strong>
                  </div>
                  {order.order_tracking_updates?.length ? (
                    <ol className="order-tracking-timeline">
                      {[...order.order_tracking_updates]
                        .sort((first, second) =>
                          second.created_at.localeCompare(first.created_at),
                        )
                        .map((update, index) => (
                          <li key={`${update.created_at}-${index}`}>
                            <strong>{update.status}</strong>
                            <span>{update.location}</span>
                            {update.note && <p>{update.note}</p>}
                            <time dateTime={update.created_at}>
                              {new Date(update.created_at).toLocaleString("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </time>
                          </li>
                        ))}
                    </ol>
                  ) : (
                    <p className="order-tracking-empty">
                      Tracking updates will appear here when your order is being prepared.
                    </p>
                  )}
                </article>
              ))
            ) : (
              <div className="orders-empty">
                <p>You have no recent orders.</p>
                <Link href="/#shop" className="primary-button shop-now-btn">
                  Discover Skincare →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
