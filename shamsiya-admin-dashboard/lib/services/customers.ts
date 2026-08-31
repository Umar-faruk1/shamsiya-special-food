import { supabase } from "@/lib/supabase/client";

export type Customer = {
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
export type CustomerOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  delivered_at: string | null;
};
export type CustomerAddress = Record<string, unknown> & {
  id?: string;
  label?: string | null;
  address?: string | null;
  city?: string | null;
  delivery_instructions?: string | null;
  is_default?: boolean | null;
  default?: boolean | null;
};
export type CustomerStats = {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
};
export type CustomerListStats = Record<string, CustomerStats>;
export type CustomerInput = {
  full_name: string;
  email: string;
  phone: string;
  status: string;
};

export async function createCustomer(input: CustomerInput) {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const response = await fetch("/api/admin/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(result?.error ?? "Unable to create customer account.");
  return result as Customer;
}

export async function getCustomers() {
  console.log("[customers] getCustomers: querying profiles with role=customer");
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, avatar_url, role, status, created_at, updated_at",
    )
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  console.log("[customers] getCustomers: response", {
    rowCount: data?.length ?? 0,
    customers: data,
    roles: data?.map((customer) => customer.role),
    statuses: data?.map((customer) => customer.status),
    error,
  });
  if (error) throw error;
  return (data ?? []) as Customer[];
}

export async function getCustomer(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, avatar_url, role, status, created_at, updated_at",
    )
    .eq("id", id)
    .eq("role", "customer")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Customer not found.");
  return data as Customer;
}

export async function getCustomerOrders(customerId: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_status, total, created_at, delivered_at",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerOrder[];
}

export async function getCustomerAddresses(customerId: string) {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerAddress[];
}

export async function getCustomerStats(
  customerId: string,
): Promise<CustomerStats> {
  const orders = await getCustomerOrders(customerId);
  return {
    totalOrders: orders.length,
    completedOrders: orders.filter((order) => order.status === "delivered")
      .length,
    cancelledOrders: orders.filter((order) =>
      ["cancelled", "failed"].includes(order.status),
    ).length,
    totalSpent: orders
      .filter(
        (order) =>
          order.status === "delivered" &&
          ["successful", "paid", "completed"].includes(order.payment_status),
      )
      .reduce((sum, order) => sum + Number(order.total ?? 0), 0),
  };
}

export async function updateCustomerStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", id)
    .eq("role", "customer")
    .select()
    .single();
  if (error) throw error;
  return data as Customer;
}

export async function getCustomerListStats(
  customerIds: string[],
): Promise<CustomerListStats> {
  console.log("[customers] getCustomerListStats: requested ids", customerIds);
  if (!customerIds.length) return {};
  const { data, error } = await supabase
    .from("orders")
    .select("customer_id, status, payment_status, total")
    .in("customer_id", customerIds);
  console.log("[customers] getCustomerListStats: response", {
    rowCount: data?.length ?? 0,
    orders: data,
    error,
  });
  if (error) throw error;
  const stats: CustomerListStats = {};
  for (const customerId of customerIds)
    stats[customerId] = {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
    };
  for (const order of data ?? []) {
    const current = stats[order.customer_id] ?? {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
    };
    current.totalOrders += 1;
    if (order.status === "delivered") current.completedOrders += 1;
    if (["cancelled", "failed"].includes(order.status))
      current.cancelledOrders += 1;
    if (
      order.status === "delivered" &&
      ["successful", "paid", "completed"].includes(order.payment_status)
    )
      current.totalSpent += Number(order.total ?? 0);
    stats[order.customer_id] = current;
  }
  return stats;
}
