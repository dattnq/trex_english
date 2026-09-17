import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfile, getAuthDestination } from "@/lib/auth";
import { appOrigin } from "@/lib/auth-config";

export async function GET(request: NextRequest) {
  const hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  let destination = "/auth/error";
  if (!request.nextUrl.searchParams.has("error") && ((hash && (type === "email" || type === "recovery")) || code)) {
    try {
      const supabase = await createClient(true);
      const { data, error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({ token_hash: hash!, type: type as "email" | "recovery" });
      if (!error && data.user?.email_confirmed_at) {
        const profile = await ensureProfile(data.user);
        destination = type === "recovery" || (code && request.nextUrl.searchParams.get("next") === "reset-password") ? "/reset-password" : getAuthDestination(profile.role);
      }
    } catch {
      destination = "/auth/error";
    }
  }
  const response = NextResponse.redirect(
    new URL(destination, appOrigin()),
    303,
  );
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
