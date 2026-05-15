import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const origin = requestUrl.origin;

  console.log("[auth/callback] request", {
    origin,
    next,
    hasCode: Boolean(code),
  });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchange failed", {
        message: error.message,
        next,
      });
      return NextResponse.redirect(new URL("/login?error=auth_callback", origin));
    }

    console.log("[auth/callback] exchange succeeded", { next });
  }

  console.log("[auth/callback] redirect", { destination: next });
  return NextResponse.redirect(new URL(next, origin));
}
