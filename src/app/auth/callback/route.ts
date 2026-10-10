import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

/** Landing point for the email-confirmation link: trades the code for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=confirmation`);
}
