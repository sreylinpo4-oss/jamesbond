"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { registerAction, type AuthActionResult } from "@/app/auth/actions";
import GoogleSignInButton from "@/components/GoogleSignInButton";

function RegisterForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    registerAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const displayError = clientError || state?.error;

  return (
    <div className="auth-card">
      <div className="auth-header">
        <Link href="/" className="logo">
          ✿ Floralyn Skin
        </Link>
        <h1>Create an account</h1>
        <p>Join Floralyn for a personalized skincare journey.</p>
      </div>

      {state?.success && state.message && (
        <div className="auth-alert success">{state.message}</div>
      )}
      {displayError && <div className="auth-alert error">{displayError}</div>}

      <form action={formAction} className="auth-form">
        <input type="hidden" name="next" value={next} />

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. floral_glow"
            pattern="[a-zA-Z0-9_]{3,20}"
            title="3-20 characters: letters, numbers, and underscores only"
            disabled={isPending}
          />
          <small className="field-hint">
            3–20 characters (letters, numbers, underscores).
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isPending}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repeat password"
            disabled={isPending}
          />
        </div>

        <button
          type="submit"
          className="primary-button auth-submit-btn"
          disabled={isPending}
        >
          {isPending ? "Creating account..." : "Create Account"}
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
        <span>Already have an account? </span>
        <Link href={`/auth/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}>
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-loading">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
