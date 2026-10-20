"use client";

import { useActionState } from "react";
import {
  changeEmailAction,
  type AuthActionResult,
} from "@/app/auth/actions";

export default function ChangeEmailForm({
  currentEmail,
}: {
  currentEmail: string;
}) {
  const [state, formAction, isPending] = useActionState<
    AuthActionResult | null,
    FormData
  >(changeEmailAction, null);

  return (
    <div>
      <p className="field-hint">
        Current email: <strong>{currentEmail}</strong>
      </p>
      {state?.message && (
        <div className="auth-alert success" role="status">
          {state.message}
        </div>
      )}
      {state?.error && (
        <div className="auth-alert error" role="alert">
          {state.error}
        </div>
      )}
      <form action={formAction} className="auth-form">
        <div className="form-group">
          <label htmlFor="new-email">New email address</label>
          <input
            id="new-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isPending}
          />
        </div>
        <button
          type="submit"
          className="primary-button auth-submit-btn"
          disabled={isPending}
        >
          {isPending ? "Updating email..." : "Change email"}
        </button>
      </form>
    </div>
  );
}
