"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { forgotPasswordAction, type AuthActionResult } from "@/app/auth/actions";

function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    forgotPasswordAction,
    null
  );

  return (
    <div className="auth-card">
      <div className="auth-header">
        <Link href="/" className="logo">
          Floralyn Skin
        </Link>
        <h1>Reset password</h1>
        <p>Enter your email and we&apos;ll send you instructions to reset your password.</p>
      </div>

      {state?.message && <div className="auth-alert success">{state.message}</div>}
      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <form action={formAction} className="auth-form">
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
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="primary-button auth-submit-btn"
          disabled={isPending}
        >
          {isPending ? "Sending link..." : "Send Reset Link"}
        </button>
      </form>

      <div className="auth-footer">
        <Link href="/auth/login">← Back to Sign In</Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-loading">Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
