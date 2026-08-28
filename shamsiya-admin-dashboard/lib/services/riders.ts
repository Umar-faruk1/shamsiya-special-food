import { supabase } from "@/lib/supabase/client";

export type RiderApprovalStatus = "pending" | "approved" | "rejected";
export type RiderStatus = "active" | "inactive";
export type RiderProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
};
export type Rider = {
  id: string;
  approval_status: RiderApprovalStatus;
  rider_status: RiderStatus;
  vehicle_type: string | null;
  vehicle_number: string | null;
  rating: number | null;
  total_deliveries: number | null;
  total_earnings: number | null;
  is_online: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  created_at: string;
  updated_at: string;
  profile?: RiderProfile | null;
  active_delivery_count?: number;
};
export type RiderOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  delivery_address: string | null;
  created_at: string;
  delivered_at: string | null;
  customer?: { full_name: string | null; phone: string | null } | null;
};
export type RiderStats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  active: number;
  inactive: number;
  online: number;
  offline: number;
};

const profileSelect =
  "id, full_name, email, phone, avatar_url, role, status, created_at, updated_at";
const activeDeliveryStatuses = [
  "rider_assigned",
  "rider_accepted",
  "picked_up",
  "out_for_delivery",
  "arrived",
];

export async function getRiders() {
  console.log("[riders] getRiders: querying riders with profiles");
  const serverResponse = await fetch("/api/admin/riders", {
    cache: "no-store",
  });
  if (serverResponse.ok) {
    const serverRiders = (await serverResponse.json()) as Rider[];
    console.log("[riders] getRiders: server response", {
      rowCount: serverRiders.length,
      profiles: serverRiders.map((rider) => ({
        riderId: rider.id,
        profile: rider.profile,
      })),
    });
    return serverRiders;
  }
  console.warn(
    "[riders] getRiders: server query unavailable, falling back to client query",
    { status: serverResponse.status },
  );
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .order("created_at", { ascending: false });
  console.log("[riders] getRiders: response", {
    rowCount: data?.length ?? 0,
    data,
    error,
  });
  if (error) throw error;
  const riderRows = (data ?? []) as Rider[];
  const riderIds = riderRows.map((rider) => rider.id);
  if (!riderIds.length) return riderRows;
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select(profileSelect)
    .in("id", riderIds);
  console.log("[riders] getRiders: profile response", {
    requestedIds: riderIds,
    profileCount: profiles?.length ?? 0,
    profiles,
    error: profileError,
  });
  if (profileError) throw profileError;
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile as RiderProfile]),
  );
  return riderRows.map((rider) => ({
    ...rider,
    profile: profileById.get(rider.id) ?? null,
  }));
}
export async function getRider(id: string) {
  console.log("[riders] getRider: querying", { id });
  const serverResponse = await fetch("/api/admin/riders", {
    cache: "no-store",
  });
  if (serverResponse.ok) {
    const serverRiders = (await serverResponse.json()) as Rider[];
    const serverRider = serverRiders.find((rider) => rider.id === id);
    console.log("[riders] getRider: server response", {
      id,
      rider: serverRider,
    });
    if (!serverRider) throw new Error("Rider not found.");
    return serverRider;
  }
  const { data, error } = await supabase
    .from("riders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  console.log("[riders] getRider: response", { data, error });
  if (error) throw error;
  if (!data) throw new Error("Rider not found.");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", id)
    .maybeSingle();
  console.log("[riders] getRider: profile response", {
    id,
    profile,
    error: profileError,
  });
  if (profileError) throw profileError;
  return {
    ...(data as Rider),
    profile: (profile as RiderProfile | null) ?? null,
  };
}
export async function getRiderOrders(riderId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, payment_status, total, delivery_address, created_at, delivered_at, customer:profiles!orders_customer_id_fkey (full_name, phone)`,
    )
    .eq("rider_id", riderId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as RiderOrder[];
}

async function countRiders(column?: string, value?: string | boolean) {
  let query = supabase
    .from("riders")
    .select("id", { count: "exact", head: true });
  if (column && value !== undefined) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}
export async function getRiderStats(): Promise<RiderStats> {
  console.log("[riders] getRiderStats: querying counts");
  const [
    total,
    approved,
    pending,
    rejected,
    active,
    inactive,
    online,
    offline,
  ] = await Promise.all([
    countRiders(),
    countRiders("approval_status", "approved"),
    countRiders("approval_status", "pending"),
    countRiders("approval_status", "rejected"),
    countRiders("rider_status", "active"),
    countRiders("rider_status", "inactive"),
    countRiders("is_online", true),
    countRiders("is_online", false),
  ]);
  const stats = {
    total,
    approved,
    pending,
    rejected,
    active,
    inactive,
    online,
    offline,
  };
  console.log("[riders] getRiderStats: result", stats);
  return stats;
}
export async function updateRiderApprovalStatus(
  id: string,
  approval_status: RiderApprovalStatus,
) {
  const { data, error } = await supabase
    .from("riders")
    .update({ approval_status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Rider;
}
export async function updateRiderStatus(id: string, rider_status: RiderStatus) {
  const { data, error } = await supabase
    .from("riders")
    .update({ rider_status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Rider;
}
export async function getRiderActiveDeliveryCount(riderId: string) {
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("rider_id", riderId)
    .in("status", activeDeliveryStatuses);
  if (error) throw error;
  return count ?? 0;
}
export async function getAvailableRiders() {
  const riders = (await getRiders()).filter(
    (rider) =>
      rider.approval_status === "approved" &&
      rider.rider_status === "active" &&
      rider.is_online,
  );
  return Promise.all(
    riders.map(async (rider) => ({
      ...rider,
      active_delivery_count: await getRiderActiveDeliveryCount(rider.id),
    })),
  ).then((result) =>
    result.sort(
      (left, right) =>
        Number(right.is_online) - Number(left.is_online) ||
        (left.active_delivery_count ?? 0) - (right.active_delivery_count ?? 0),
    ),
  );
}

export type RiderInput = {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  vehicle_type: string;
  vehicle_number: string;
  rider_status: RiderStatus;
  approval_status: RiderApprovalStatus;
};

export async function createRider(input: RiderInput) {
  const response = await fetch("/api/admin/riders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(result?.error ?? "Unable to create rider account.");
  return result as Rider;
}

export async function updateRiderProfile(
  id: string,
  input: Pick<
    RiderInput,
    | "full_name"
    | "email"
    | "phone"
    | "vehicle_type"
    | "vehicle_number"
    | "rider_status"
    | "approval_status"
  >,
) {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone,
    })
    .eq("id", id);
  if (profileError) throw profileError;
  const { data, error } = await supabase
    .from("riders")
    .update({
      vehicle_type: input.vehicle_type,
      vehicle_number: input.vehicle_number,
      rider_status: input.rider_status,
      approval_status: input.approval_status,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Rider;
}
