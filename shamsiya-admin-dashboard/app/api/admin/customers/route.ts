import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function errorDetails(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };
    return [value.message, value.code, value.details, value.hint]
      .filter(Boolean)
      .map(String)
      .join(" | ");
  }
  return String(error);
}

function failureResponse(message: string, error: unknown, status: number) {
  const details = errorDetails(error);
  console.error(`[customers] ${message}`, { details, status });
  return NextResponse.json(
    {
      error: message,
      ...(process.env.NODE_ENV !== "production" ? { details } : {}),
    },
    { status },
  );
}

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin
    ).replace(/\/$/, "");
    if (!url || !publicKey || !serviceKey) {
      console.error("[customers] Missing Supabase server configuration", {
        hasUrl: Boolean(url),
        hasPublicKey: Boolean(publicKey),
        hasServiceKey: Boolean(serviceKey),
      });
      return NextResponse.json(
        { error: "Customer account creation is not configured." },
        { status: 503 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return failureResponse("Request body must be valid JSON.", error, 400);
    }
    if (!body || typeof body !== "object")
      return failureResponse("Request body must be an object.", body, 400);

    const input = body as Record<string, unknown>;
    const fullName =
      typeof input.full_name === "string" ? input.full_name.trim() : "";
    const email =
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const phone = typeof input.phone === "string" ? input.phone.trim() : "";
    const status = typeof input.status === "string" ? input.status : "active";
    if (fullName.length < 2)
      return failureResponse(
        "Full name must be at least 2 characters.",
        { field: "full_name" },
        400,
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return failureResponse(
        "Enter a valid email address.",
        { field: "email" },
        400,
      );
    if (!phone)
      return failureResponse(
        "Phone number is required.",
        { field: "phone" },
        400,
      );
    if (status !== "active")
      return failureResponse(
        "Customer status must be active.",
        { field: "status" },
        400,
      );

    const token = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");
    if (!token)
      return NextResponse.json(
        { error: "You must be signed in as an administrator." },
        { status: 401 },
      );
    const publicClient = createClient(url, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } =
      await publicClient.auth.getUser(token);
    if (userError || !userData.user) {
      console.error("[customers] Admin token validation failed", {
        message: userError?.message,
        code: userError?.code,
      });
      return NextResponse.json(
        { error: "You must be signed in as an administrator." },
        { status: 401 },
      );
    }
    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: adminProfile, error: adminError } = await adminClient
      .from("profiles")
      .select("role, status")
      .eq("id", userData.user.id)
      .single();
    if (adminError) {
      return failureResponse(
        "Unable to verify administrator permissions.",
        adminError,
        500,
      );
    }
    if (adminProfile?.role !== "admin" || adminProfile.status !== "active")
      return NextResponse.json(
        { error: "Only active administrators can create customers." },
        { status: 403 },
      );

    const { data: invited, error: authError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName },
        redirectTo: `${appUrl}/auth/callback`,
      });
    if (authError || !invited.user) {
      const authMessage = authError?.message.toLowerCase() ?? "";
      const duplicate =
        authMessage.includes("already") || authMessage.includes("exists");
      const rateLimited =
        authMessage.includes("rate limit") ||
        authMessage.includes("too many") ||
        authMessage.includes("429");
      return failureResponse(
        rateLimited
          ? "Supabase email rate limit exceeded. Wait before sending another invitation or configure custom SMTP in Supabase."
          : duplicate
            ? "A customer account with this email already exists."
            : "Unable to send customer invitation.",
        authError ?? new Error("Supabase did not return an invited user."),
        rateLimited ? 429 : duplicate ? 409 : 500,
      );
    }
    const { data: customer, error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: invited.user.id,
        full_name: fullName,
        email,
        phone,
        role: "customer",
        status: "active",
      })
      .select(
        "id, full_name, email, phone, avatar_url, role, status, created_at, updated_at",
      )
      .single();
    if (profileError || !customer) {
      const { error: cleanupError } = await adminClient.auth.admin.deleteUser(
        invited.user.id,
      );
      console.error("[customers] Profile creation failed after invitation", {
        userId: invited.user.id,
        cleanupError: cleanupError?.message,
      });
      return failureResponse(
        "Customer profile could not be created.",
        profileError ??
          new Error("Supabase did not return the customer profile."),
        500,
      );
    }
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return failureResponse("Unexpected customer creation error.", error, 500);
  }
}
