import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  if (!code)
    return NextResponse.redirect(
      new URL("/auth/set-password?error=missing_code", origin),
    );
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(
      new URL("/auth/set-password?error=invalid_invitation", origin),
    );
  return NextResponse.redirect(new URL("/auth/set-password", origin));
}
