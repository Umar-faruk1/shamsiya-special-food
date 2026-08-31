import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!url || !publicKey || !serviceKey)
    return NextResponse.json(
      {
        error:
          "Customer account creation is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 },
    );
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
  if (userError || !userData.user)
    return NextResponse.json(
      { error: "You must be signed in as an administrator." },
      { status: 401 },
    );
  const adminClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: adminProfile, error: adminError } = await adminClient
    .from("profiles")
    .select("role, status")
    .eq("id", userData.user.id)
    .single();
  if (
    adminError ||
    adminProfile?.role !== "admin" ||
    adminProfile.status !== "active"
  )
    return NextResponse.json(
      { error: "Only active administrators can create customers." },
      { status: 403 },
    );
  const body = await request.json();
  const fullName = String(body.full_name ?? "").trim();
  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const status = String(body.status ?? "active");
  if (fullName.length < 2)
    return NextResponse.json(
      { error: "Full name must be at least 2 characters." },
      { status: 400 },
    );
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  if (!phone)
    return NextResponse.json(
      { error: "Phone number is required." },
      { status: 400 },
    );
  const { data: invited, error: authError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: `${appUrl.replace(/\/$/, "")}/auth/callback`,
    });
  if (authError || !invited.user) {
    const duplicate =
      authError?.message.toLowerCase().includes("already") ||
      authError?.message.toLowerCase().includes("exists");
    return NextResponse.json(
      {
        error: duplicate
          ? "A customer account with this email already exists."
          : "Unable to create customer account.",
      },
      { status: duplicate ? 409 : 400 },
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
      status,
    })
    .select(
      "id, full_name, email, phone, avatar_url, role, status, created_at, updated_at",
    )
    .single();
  if (profileError || !customer) {
    await adminClient.auth.admin.deleteUser(invited.user.id);
    return NextResponse.json(
      { error: "Customer profile could not be created." },
      { status: 400 },
    );
  }
  return NextResponse.json(customer, { status: 201 });
}
