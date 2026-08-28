import { supabase } from "@/lib/supabase/client";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "rider_assigned"
  | "rider_accepted"
  | "picked_up"
  | "out_for_delivery"
  | "arrived"
  | "delivered"
  | "cancelled"
  | "failed";

const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ["confirmed", "cancelled", "failed"],
  confirmed: ["preparing", "cancelled", "failed"],
  preparing: ["ready_for_pickup", "cancelled", "failed"],
  ready_for_pickup: ["rider_assigned", "cancelled", "failed"],
  rider_assigned: ["rider_accepted", "failed"],
  rider_accepted: ["picked_up", "failed"],
  picked_up: ["out_for_delivery", "failed"],
  out_for_delivery: ["arrived", "failed"],
  arrived: ["delivered", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

export type PaymentStatus =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "refunded";

export type OrderItem = {
  id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_options: Record<string, unknown> | null;
  notes: string | null;
};

export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  rider_id: string | null;

  status: OrderStatus;

  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;

  payment_status: PaymentStatus;
  payment_method: string | null;

  address_id: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;

  customer_note: string | null;
  rider_note: string | null;
  delivery_pin: string | null;

  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;

  created_at: string;
  updated_at: string;
};

export async function getOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      customer:profiles!orders_customer_id_fkey (
        id,
        full_name,
        email,
        phone
      ),
      rider:riders!orders_rider_id_fkey (
        id,
        approval_status,
        rider_status,
        vehicle_type,
        vehicle_number,
        rating,
        total_deliveries,
        total_earnings,
        is_online,
        current_latitude,
        current_longitude,
        profile:profiles!riders_id_fkey (
          full_name,
          email,
          phone,
          avatar_url
        )
      ),
      address:addresses!orders_address_id_fkey (
        id,
        label,
        address,
        city,
        latitude,
        longitude,
        delivery_instructions
      ),
      order_items (
        id,
        menu_item_id,
        name,
        quantity,
        unit_price,
        total_price,
        selected_options,
        notes
      )
    `,
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load orders:", error);
    throw error;
  }

  return data;
}

export async function getOrder(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      customer:profiles!orders_customer_id_fkey (
        id,
        full_name,
        email,
        phone
      ),
      rider:riders!orders_rider_id_fkey (
        id,
        approval_status,
        rider_status,
        vehicle_type,
        vehicle_number,
        rating,
        total_deliveries,
        total_earnings,
        is_online,
        current_latitude,
        current_longitude,
        profile:profiles!riders_id_fkey (
          full_name,
          email,
          phone,
          avatar_url
        )
      ),
      address:addresses!orders_address_id_fkey (
        id,
        label,
        address,
        city,
        latitude,
        longitude,
        delivery_instructions
      ),
      order_items (
        id,
        menu_item_id,
        name,
        quantity,
        unit_price,
        total_price,
        selected_options,
        notes
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to load order:", error);
    throw error;
  }

  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const { data: currentOrder, error: currentOrderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (currentOrderError) {
    throw currentOrderError;
  }

  if (
    !allowedTransitions[currentOrder.status as OrderStatus]?.includes(status)
  ) {
    throw new Error(
      `Cannot change an order from ${currentOrder.status} to ${status}.`,
    );
  }

  const updates: Record<string, unknown> = {
    status,
  };

  if (status === "rider_accepted") {
    updates.accepted_at = new Date().toISOString();
  }

  if (status === "picked_up") {
    updates.picked_up_at = new Date().toISOString();
  }

  if (status === "delivered") {
    updates.delivered_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function cancelOrder(id: string, reason: string) {
  const { data: currentOrder, error: currentOrderError } = await supabase
    .from("orders")
    .select("status, customer_note")
    .eq("id", id)
    .single();

  if (currentOrderError) {
    throw currentOrderError;
  }

  if (
    !allowedTransitions[currentOrder.status as OrderStatus]?.includes(
      "cancelled",
    )
  ) {
    throw new Error(`Cannot cancel an order from ${currentOrder.status}.`);
  }

  const updates: Record<string, unknown> = {
    status: "cancelled",
    customer_note: currentOrder.customer_note
      ? `${currentOrder.customer_note}\nCANCELLATION REASON: ${reason}`
      : `CANCELLATION REASON: ${reason}`,
  };

  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function assignRider(orderId: string, riderId: string) {
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (orderError) throw orderError;
  if (
    ![
      "pending",
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "rider_assigned",
    ].includes(order.status)
  ) {
    throw new Error("This order can no longer be assigned to a rider.");
  }

  const { data: rider, error: riderError } = await supabase
    .from("riders")
    .select("id, approval_status, rider_status, is_online")
    .eq("id", riderId)
    .single();

  if (riderError) throw riderError;
  if (rider.approval_status !== "approved" || rider.rider_status !== "active") {
    throw new Error("This rider is not eligible for assignment.");
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      status: "rider_assigned",
      rider_id: riderId,
    })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAvailableRiders() {
  const { data, error } = await supabase
    .from("riders")
    .select(
      `
      id,
      approval_status,
      rider_status,
      vehicle_type,
      vehicle_number,
      rating,
      total_deliveries,
      total_earnings,
      is_online,
      current_latitude,
      current_longitude
    `,
    )
    .eq("approval_status", "approved")
    .eq("rider_status", "active")
    .order("is_online", {
      ascending: false,
    });

  if (error) {
    console.error("Failed to load riders:", error);
    throw error;
  }

  return data;
}

type Customer = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type Rider = {
  id: string;
  approval_status: string;
  rider_status: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  rating: number | null;
  total_deliveries: number;
  total_earnings: number;
  is_online: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
};

type Address = {
  id: string;
  label: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_instructions: string | null;
};

type OrderWithRelations = Order & {
  customer: Customer | null;
  rider: Rider | null;
  address: Address | null;
  order_items: OrderItem[];
};
