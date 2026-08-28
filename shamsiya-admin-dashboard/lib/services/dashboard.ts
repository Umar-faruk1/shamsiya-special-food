import { supabase } from "@/lib/supabase/client";

export async function getDashboardStats() {
  const [ordersResult, customersResult, ridersResult] = await Promise.all([
    supabase.from("orders").select("*", {
      count: "exact",
      head: true,
    }),

    supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .or("role.is.null,role.not.in.(admin,rider)"),

    supabase
      .from("profiles")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("role", "rider"),
  ]);

  if (ordersResult.error) {
    throw ordersResult.error;
  }

  if (customersResult.error) {
    throw customersResult.error;
  }

  if (ridersResult.error) {
    throw ridersResult.error;
  }

  return {
    orders: ordersResult.count ?? 0,
    customers: customersResult.count ?? 0,
    riders: ridersResult.count ?? 0,
  };
}

type DashboardOrder = Record<string, unknown>;

export async function getDashboardData() {
  const [ordersResult, customersResult, ridersResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .or("role.is.null,role.not.in.(customer,rider)"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "rider"),
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (customersResult.error) throw customersResult.error;
  if (ridersResult.error) throw ridersResult.error;

  return {
    orders: (ordersResult.data ?? []) as DashboardOrder[],
    stats: {
      orders: ordersResult.count ?? 0,
      customers: customersResult.count ?? 0,
      riders: ridersResult.count ?? 0,
    },
  };
}
