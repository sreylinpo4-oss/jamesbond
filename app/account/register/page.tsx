"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import BrandMark from "@/components/BrandMark";
import { defaultProfile, saveAccountProfile } from "@/lib/account";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("Nadia Smith");
  const [email, setEmail] = useState("nadiasmith@example.com");
  const [phone, setPhone] = useState("+855 12 345 678");
  const [password, setPassword] = useState("demo1234");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveAccountProfile({
      ...defaultProfile,
      fullName,
      email,
      phone,
      provider: "Email",
    });
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
        <Link href="/account/login" className="text-link">Sign in</Link>
      </header>

      <div className="auth-page-shell">
        <div className="auth-form-card">
          <div className="eyebrow">REGISTER</div>
          <h1>Create your account</h1>
          <p>Set up your profile, preferences, and shopping details in one place.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>

            <div className="two-up auth-two-up">
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </label>
              <label>
                Phone
                <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
              </label>
            </div>

            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>

            <div className="register-benefits">
              <span>Saved addresses</span>
              <span>Stored payment methods</span>
              <span>Preference center</span>
            </div>

            <button type="submit" className="button button-dark auth-submit">
              Create account
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
