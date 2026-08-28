import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  if (
    request.headers
      .get("cookie")
      ?.includes("shamsiya_session=authenticated") !== true
  )
    return NextResponse.json(
      { error: "You must be signed in as an administrator." },
      { status: 401 },
    );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url)
    return NextResponse.json(
      { error: "Rider account access is not configured on the server." },
      { status: 503 },
    );
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: riders, error: riderError } = await admin
    .from("riders")
    .select("*")
    .order("created_at", { ascending: false });
  if (riderError)
    return NextResponse.json(
      { error: "Unable to load riders." },
      { status: 500 },
    );
  const ids = (riders ?? []).map((rider) => rider.id);
  const { data: profiles, error: profileError } = ids.length
    ? await admin
        .from("profiles")
        .select(
          "id, full_name, email, phone, avatar_url, role, status, created_at, updated_at",
        )
        .in("id", ids)
    : { data: [], error: null };
  if (profileError)
    return NextResponse.json(
      { error: "Unable to load rider profiles." },
      { status: 500 },
    );
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  return NextResponse.json(
    (riders ?? []).map((rider) => ({
      ...rider,
      profile: profileById.get(rider.id) ?? null,
    })),
  );
}

export async function POST(request: Request) {
  if (
    request.headers
      .get("cookie")
      ?.includes("shamsiya_session=authenticated") !== true
  )
    return NextResponse.json(
      { error: "You must be signed in as an administrator." },
      { status: 401 },
    );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url)
    return NextResponse.json(
      {
        error:
          "Rider account creation is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 },
    );
  const body = await request.json();
  if (
    !body.full_name ||
    !body.email ||
    !body.password ||
    !body.vehicle_type ||
    !body.vehicle_number
  )
    return NextResponse.json(
      {
        error:
          "Name, email, password, vehicle type, and vehicle number are required.",
      },
      { status: 400 },
    );
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: authError } =
    await admin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: { full_name: body.full_name },
    });
  if (authError || !userData.user)
    return NextResponse.json(
      { error: authError?.message ?? "Unable to create rider account." },
      { status: 400 },
    );
  const userId = userData.user.id;
  const { error: profileError } = await admin
    .from("profiles")
    .upsert({
      id: userId,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone ?? null,
      role: "rider",
      status: "active",
    });
  const { data: rider, error: riderError } = await admin
    .from("riders")
    .insert({
      id: userId,
      vehicle_type: body.vehicle_type,
      vehicle_number: body.vehicle_number,
      rider_status: body.rider_status,
      approval_status: body.approval_status,
      is_online: false,
      total_deliveries: 0,
      total_earnings: 0,
    })
    .select()
    .single();
  if (profileError || riderError) {
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      {
        error:
          profileError?.message ??
          riderError?.message ??
          "Unable to create rider record.",
      },
      { status: 400 },
    );
  }
  return NextResponse.json(rider, { status: 201 });
}
