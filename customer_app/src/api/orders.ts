import { supabase } from "./supabase";

export type OrderStatusValue =
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

export type PaymentStatusValue =
  | "pending"
  | "processing"
  | "successful"
  | "failed"
  | "refunded";

export type PaymentMethodValue = "cash" | "mobile_money" | "card";

export interface CustomerOrder {
  id: string;
  order_number: string;
  customer_id: string;
  rider_id: string | null;
  status: OrderStatusValue;
  subtotal: number | string;
  delivery_fee: number | string;
  discount: number | string;
  total: number | string;
  payment_status: PaymentStatusValue;
  payment_method: PaymentMethodValue | null;
  address_id: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  customer_note: string | null;
  rider_note: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerOrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  name: string;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  selected_options: unknown;
  notes: string | null;
  created_at: string;
}

export interface TrackingRider {
  id: string;
  vehicle_type: string | null;
  vehicle_number: string | null;
  rating: number | string | null;
  is_online: boolean | null;
  current_latitude: number | null;
  current_longitude: number | null;
}

export interface TrackingRiderProfile {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface TrackingLocation {
  latitude: number | null;
  longitude: number | null;
  heading: number | null;
  speed: number | null;
  is_online: boolean | null;
  updated_at: string | null;
}

export interface CustomerOrderTracking {
  order: CustomerOrder;
  rider: TrackingRider | null;
  rider_profile: TrackingRiderProfile | null;
  location: TrackingLocation | null;
}

const ORDER_COLUMNS =
  "id,order_number,customer_id,rider_id,status,subtotal,delivery_fee,discount,total,payment_status,payment_method,address_id,delivery_address,delivery_latitude,delivery_longitude,customer_note,rider_note,accepted_at,picked_up_at,delivered_at,created_at,updated_at";
const ITEM_COLUMNS =
  "id,order_id,menu_item_id,name,quantity,unit_price,total_price,selected_options,notes,created_at";

export async function fetchCustomerOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CustomerOrder[];
}

export async function fetchCustomerOrder(orderId: string) {
  const [
    { data: order, error: orderError },
    { data: items, error: itemsError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select(ORDER_COLUMNS)
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("order_items")
      .select(ITEM_COLUMNS)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
  ]);
  if (orderError) throw orderError;
  if (itemsError) throw itemsError;
  return {
    order: order as CustomerOrder | null,
    items: (items ?? []) as CustomerOrderItem[],
  };
}

function unwrapTrackingResponse(data: unknown): CustomerOrderTracking {
  const response = Array.isArray(data) ? data[0] : data;
  if (!response || typeof response !== "object" || !("order" in response)) {
    throw new Error("Tracking response was incomplete.");
  }
  return response as CustomerOrderTracking;
}

export async function fetchCustomerOrderTracking(orderId: string) {
  const { data, error } = await supabase.rpc("get_customer_order_tracking", {
    p_order_id: orderId,
  });
  if (error) throw error;
  return unwrapTrackingResponse(data);
}
