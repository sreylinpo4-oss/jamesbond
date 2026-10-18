"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { resetPasswordAction, type AuthActionResult } from "@/app/auth/actions";

function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    resetPasswordAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="auth-card">
      <div className="auth-header">
        <Link href="/" className="logo">
          ✿ Floralyn Skin
        </Link>
        <h1>Set new password</h1>
        <p>Please enter your new password below.</p>
      </div>

      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <form action={formAction} className="auth-form">
        <div className="form-group">
          <label htmlFor="password">New Password</label>
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
              autoFocus
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
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repeat new password"
            disabled={isPending}
          />
        </div>

        <button
          type="submit"
          className="primary-button auth-submit-btn"
          disabled={isPending}
        >
          {isPending ? "Updating password..." : "Update Password"}
        </button>
      </form>

      <div className="auth-footer">
        <Link href="/auth/login">← Back to Sign In</Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-loading">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
