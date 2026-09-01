import { supabase } from "@/lib/supabase/client";
import type { OrderStatus, PaymentStatus } from "@/lib/services/orders";

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "rider_assigned",
  "rider_accepted",
  "picked_up",
  "out_for_delivery",
  "arrived",
  "delivered",
  "cancelled",
  "failed",
];

export type RevenueData = { day: string; revenue: number; orders: number };
export type OrderStatusStats = { status: OrderStatus; count: number };
export type RecentOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  created_at: string;
};
export type TopSellingFood = {
  name: string;
  quantity: number;
  revenue: number;
};
export type DashboardStats = {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingOrders: number;
  preparingOrders: number;
  outForDeliveryOrders: number;
  deliveredOrders: number;
  totalCustomers: number;
  activeCustomers: number;
  totalRiders: number;
  approvedRiders: number;
  pendingRiders: number;
  rejectedRiders: number;
  activeRiders: number;
  inactiveRiders: number;
  onlineRiders: number;
  offlineRiders: number;
};
export type DashboardData = {
  stats: DashboardStats;
  revenue: RevenueData[];
  orderStatuses: OrderStatusStats[];
  recentOrders: RecentOrder[];
  topFoods: TopSellingFood[];
};

function todayInGhana() {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
  }).format(new Date());
  return `${date}T00:00:00.000Z`;
}

function dayLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GH", {
    timeZone: "Africa/Accra",
    weekday: "short",
  }).format(date);
}

function isSuccessfulPayment(value: string): value is "successful" {
  return value === "successful";
}

export async function getDashboardData(): Promise<DashboardData> {
  const [ordersResult, customersResult, activeCustomersResult, ridersResult] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, order_number, customer_id, status, total, payment_status, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer")
        .eq("status", "active"),
      supabase
        .from("riders")
        .select("approval_status, rider_status, is_online"),
    ]);
  if (ordersResult.error) throw ordersResult.error;
  if (customersResult.error) throw customersResult.error;
  if (activeCustomersResult.error) throw activeCustomersResult.error;
  if (ridersResult.error) throw ridersResult.error;

  const orders = ordersResult.data ?? [];
  const customerIds = [
    ...new Set(orders.slice(0, 10).map((order) => order.customer_id)),
  ];
  const customerResult = customerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", customerIds)
    : { data: [], error: null };
  if (customerResult.error) throw customerResult.error;
  const customerNames = new Map(
    (customerResult.data ?? []).map((customer) => [
      customer.id,
      customer.full_name ?? "Unknown customer",
    ]),
  );
  const successfulOrders = orders.filter((order) =>
    isSuccessfulPayment(order.payment_status),
  );
  const today = todayInGhana();
  const todayOrders = orders.filter((order) => order.created_at >= today);
  const todayRevenueOrders = successfulOrders.filter(
    (order) => order.created_at >= today,
  );
  const statusCounts = ORDER_STATUSES.map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
  const countStatus = (status: OrderStatus) =>
    statusCounts.find((item) => item.status === status)?.count ?? 0;
  const riders = ridersResult.data ?? [];
  const revenue = Array.from({ length: 7 }, (_, index) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (6 - index));
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const dayOrders = successfulOrders.filter((order) => {
      const created = new Date(order.created_at);
      return created >= start && created < end;
    });
    return {
      day: dayLabel(start),
      revenue: dayOrders.reduce(
        (sum, order) => sum + Number(order.total ?? 0),
        0,
      ),
      orders: dayOrders.length,
    };
  });
  const itemResult = successfulOrders.length
    ? await supabase
        .from("order_items")
        .select("order_id, name, quantity, total_price")
        .in(
          "order_id",
          successfulOrders.map((order) => order.id),
        )
    : { data: [], error: null };
  if (itemResult.error) throw itemResult.error;
  const foodTotals = new Map<string, TopSellingFood>();
  for (const item of itemResult.data ?? []) {
    const current = foodTotals.get(item.name) ?? {
      name: item.name,
      quantity: 0,
      revenue: 0,
    };
    current.quantity += Number(item.quantity ?? 0);
    current.revenue += Number(item.total_price ?? 0);
    foodTotals.set(item.name, current);
  }
  return {
    stats: {
      totalOrders: orders.length,
      todayOrders: todayOrders.length,
      totalRevenue: successfulOrders.reduce(
        (sum, order) => sum + Number(order.total ?? 0),
        0,
      ),
      todayRevenue: todayRevenueOrders.reduce(
        (sum, order) => sum + Number(order.total ?? 0),
        0,
      ),
      pendingOrders: countStatus("pending"),
      preparingOrders: countStatus("preparing"),
      outForDeliveryOrders: countStatus("out_for_delivery"),
      deliveredOrders: countStatus("delivered"),
      totalCustomers: customersResult.count ?? 0,
      activeCustomers: activeCustomersResult.count ?? 0,
      totalRiders: riders.length,
      approvedRiders: riders.filter(
        (rider) => rider.approval_status === "approved",
      ).length,
      pendingRiders: riders.filter(
        (rider) => rider.approval_status === "pending",
      ).length,
      rejectedRiders: riders.filter(
        (rider) => rider.approval_status === "rejected",
      ).length,
      activeRiders: riders.filter((rider) => rider.rider_status === "active")
        .length,
      inactiveRiders: riders.filter(
        (rider) => rider.rider_status === "inactive",
      ).length,
      onlineRiders: riders.filter((rider) => rider.is_online === true).length,
      offlineRiders: riders.filter((rider) => rider.is_online === false).length,
    },
    revenue,
    orderStatuses: statusCounts,
    recentOrders: orders.slice(0, 10).map((order) => ({
      id: order.id,
      order_number: order.order_number,
      customer_name: customerNames.get(order.customer_id) ?? "Unknown customer",
      total: Number(order.total ?? 0),
      payment_status: order.payment_status,
      status: order.status,
      created_at: order.created_at,
    })),
    topFoods: [...foodTotals.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
  };
}
