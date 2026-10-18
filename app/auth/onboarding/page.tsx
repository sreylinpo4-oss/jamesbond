"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { onboardingAction, type AuthActionResult } from "@/app/auth/actions";

function OnboardingForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    onboardingAction,
    null
  );

  return (
    <div className="auth-card">
      <div className="auth-header">
        <Link href="/" className="logo">
          ✿ Floralyn Skin
        </Link>
        <h1>One last step</h1>
        <p>Choose a unique username to complete your profile.</p>
      </div>

      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <form action={formAction} className="auth-form">
        <input type="hidden" name="next" value={next} />

        <div className="form-group">
          <label htmlFor="username">Choose a Username</label>
          <input
            id="username"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. glow_seeker"
            pattern="[a-zA-Z0-9_]{3,20}"
            title="3-20 characters: letters, numbers, and underscores only"
            disabled={isPending}
            autoFocus
          />
          <small className="field-hint">
            3–20 characters. You can change this later in your profile.
          </small>
        </div>

        <button
          type="submit"
          className="primary-button auth-submit-btn"
          disabled={isPending}
        >
          {isPending ? "Setting up profile..." : "Complete Setup →"}
        </button>
      </form>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <main className="auth-page">
      <Suspense fallback={<div className="auth-loading">Loading...</div>}>
        <OnboardingForm />
      </Suspense>
    </main>
  );
}
