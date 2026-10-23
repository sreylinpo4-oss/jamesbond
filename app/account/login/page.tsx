"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import BrandMark from "@/components/BrandMark";
import { defaultProfile, saveAccountProfile } from "@/lib/account";

const authMethods = ["Email", "Phone", "Google", "Facebook", "Apple"] as const;

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("nadiasmith@example.com");
  const [password, setPassword] = useState("demo1234");
  const [provider, setProvider] = useState<(typeof authMethods)[number]>("Email");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profile = {
      ...defaultProfile,
      email: identifier.includes("@") ? identifier : defaultProfile.email,
      phone: identifier.includes("@") ? defaultProfile.phone : identifier,
      provider,
    };

    saveAccountProfile(profile);
    router.push("/account");
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
        <Link href="/account/register" className="text-link">Create account</Link>
      </header>

      <div className="auth-page-shell">
        <div className="auth-form-card">
          <div className="eyebrow">SIGN IN</div>
          <h1>Welcome back</h1>
          <p>Access your dashboard, orders, saved addresses, and preferences.</p>

          <div className="auth-methods">
            {authMethods.map((method) => (
              <button
                key={method}
                className={provider === method ? "auth-option selected" : "auth-option"}
                type="button"
                onClick={() => setProvider(method)}
              >
                {method}
              </button>
            ))}
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              {provider === "Phone" ? "Phone number" : "Email or phone"}
              <input
                type={provider === "Phone" ? "tel" : "text"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder={provider === "Phone" ? "+855 12 345 678" : "your@email.com"}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            <button type="submit" className="button button-dark auth-submit">
              Log in
            </button>
          </form>

          <div className="auth-divider">
            <span>or continue with</span>
          </div>

          <div className="social-auth-grid">
            <button type="button" className="button button-ghost social-btn">Google</button>
            <button type="button" className="button button-ghost social-btn">Facebook</button>
            <button type="button" className="button button-ghost social-btn">Apple</button>
          </div>
        </div>
      </div>
    </main>
  );
}
