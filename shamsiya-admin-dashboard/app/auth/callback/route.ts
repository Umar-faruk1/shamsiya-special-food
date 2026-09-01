import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  const providerError = url.searchParams.get("error");

  if (providerError || !code)
    return NextResponse.redirect(
      new URL(
        `/auth/set-password?error=${providerError ? "invalid_invitation" : "missing_code"}`,
        origin,
      ),
    );

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user)
    return NextResponse.redirect(
      new URL("/auth/set-password?error=invalid_invitation", origin),
    );

  return NextResponse.redirect(new URL("/auth/set-password", origin));
}
