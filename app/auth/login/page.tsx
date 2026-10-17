"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction, type AuthActionResult } from "@/app/auth/actions";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const errorParam = searchParams.get("error");
  const messageParam = searchParams.get("message");

  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    loginAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const displayError = clientError || state?.error || errorParam;

  return (
    <div className="auth-card">
      <div className="auth-header">
        <Link href="/" className="logo">
          ✿ Floralyn Skin
        </Link>
        <h1>Welcome back</h1>
        <p>Sign in to your Floralyn account to continue.</p>
      </div>

      {messageParam && <div className="auth-alert success">{messageParam}</div>}
      {displayError && <div className="auth-alert error">{displayError}</div>}

      <form action={formAction} className="auth-form">
        <input type="hidden" name="next" value={next} />

        <div className="form-group">
          <label htmlFor="identifier">Username or Email</label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. skinlover or you@example.com"
            disabled={isPending}
          />
        </div>

        <div className="form-group">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <Link href="/auth/forgot-password" className="sub-link">
              Forgot password?
            </Link>
          </div>
          <div className="password-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              disabled={isPending}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="primary-button auth-submit-btn"
          disabled={isPending}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <GoogleSignInButton
        next={next}
        onError={(err) => setClientError(err)}
      />

      <div className="auth-footer">
        <span>Don&apos;t have an account? </span>
        <Link href={`/auth/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Create an account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-loading">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
