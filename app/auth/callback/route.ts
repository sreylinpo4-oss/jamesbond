import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  // Sanitize redirect target to prevent open-redirect vulnerabilities
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") ? next : "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user already has an established profile with a username
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .maybeSingle();

      // If user signed in with Google and doesn't have a username yet, send to onboarding
      if (!profile || !profile.username) {
        return NextResponse.redirect(`${origin}/auth/onboarding?next=${encodeURIComponent(safeNext)}`);
      }

      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Return to login with error parameter if code exchange failed
  return NextResponse.redirect(
    `${origin}/auth/login?error=${encodeURIComponent(
      "Unable to authenticate with Google. Please try again."
    )}`
  );
}
