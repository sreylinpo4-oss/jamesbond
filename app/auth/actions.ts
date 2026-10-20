"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface AuthActionResult {
  error?: string;
  success?: boolean;
  message?: string;
}

function sanitizeRedirect(url: string | null): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) {
    return "/";
  }
  return url;
}

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const identifier = formData.get("identifier")?.toString().trim();
  const password = formData.get("password")?.toString();
  const next = sanitizeRedirect(formData.get("next")?.toString() || null);

  if (!identifier || !password) {
    return { error: "Please enter your username/email and password." };
  }

  const supabase = await createClient();
  let email = identifier;

  // If user entered a username instead of an email, look up corresponding email
  if (!identifier.includes("@")) {
    const { data: lookedUpEmail, error: rpcError } = await supabase.rpc(
      "get_email_by_username",
      { lookup_username: identifier }
    );

    if (rpcError || !lookedUpEmail) {
      // Intentionally generic error to prevent username harvesting
      return { error: "Invalid username/email or password." };
    }
    email = lookedUpEmail;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid username/email or password." };
  }

  redirect(next);
}

export async function registerAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const username = formData.get("username")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();
  const next = sanitizeRedirect(formData.get("next")?.toString() || null);

  if (!username || !email || !password || !confirmPassword) {
    return { error: "All fields are required." };
  }

  // Username validation: 3-20 chars, alphanumeric + underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return {
      error:
        "Username must be between 3 and 20 characters and contain only letters, numbers, and underscores.",
    };
  }

  // Password validation: minimum 8 characters
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();

  // Check username uniqueness
  const { data: isAvailable, error: checkError } = await supabase.rpc(
    "check_username_available",
    { check_username: username }
  );

  if (checkError) {
    console.error("Error checking username availability:", checkError);
  } else if (isAvailable === false) {
    return { error: "This username is already taken. Please choose another." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username.toLowerCase(),
        full_name: username,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase has email confirmation disabled, user session is automatically established
  if (data.session) {
    redirect(next);
  }

  // If email confirmation is enabled on the Supabase dashboard
  return {
    success: true,
    message: "Account created! Please check your email to confirm your account.",
  };
}

export async function onboardingAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const username = formData.get("username")?.toString().trim();
  const next = sanitizeRedirect(formData.get("next")?.toString() || null);

  if (!username) {
    return { error: "Please enter a username." };
  }

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return {
      error:
        "Username must be 3-20 characters long and contain only letters, numbers, and underscores.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check availability
  const { data: isAvailable } = await supabase.rpc("check_username_available", {
    check_username: username,
  });

  if (isAvailable === false) {
    return { error: "This username is already taken. Please choose another." };
  }

  // Insert or update profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    username: username.toLowerCase(),
    display_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      username,
    avatar_url:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
    role: "member",
  });

  if (profileError) {
    return { error: profileError.message };
  }

  redirect(next);
}

export async function forgotPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!email || !email.includes("@")) {
    return { error: "Please provide a valid email address." };
  }

  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/reset-password`,
  });

  if (error) {
    // Return friendly generic response to avoid email enumeration
    console.error("Password reset error:", error);
  }

  return {
    success: true,
    message:
      "If an account is associated with this email, you will receive password reset instructions shortly.",
  };
}

export async function resetPasswordAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || !confirmPassword) {
    return { error: "Please enter and confirm your new password." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect("/auth/login?message=" + encodeURIComponent("Your password has been reset. Please sign in with your new password."));
}

export async function changeEmailAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email")?.toString().trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/account");
  }

  if (email === user.email?.toLowerCase()) {
    return { error: "That is already your current email address." };
  }

  const { error } = await supabase.auth.updateUser({ email });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: "Email change requested. Check your inbox for a confirmation email.",
  };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
