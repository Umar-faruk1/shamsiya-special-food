import { supabase } from "./supabase";

export interface CustomerReview {
  id: string;
  order_id: string;
  customer_id: string;
  rider_id: string | null;
  menu_item_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

const reviewColumns =
  "id,order_id,customer_id,rider_id,menu_item_id,rating,comment,created_at";

export async function fetchCustomerOrderReviews(
  orderId: string,
  customerId: string,
) {
  const { data, error } = await supabase
    .from("reviews")
    .select(reviewColumns)
    .eq("order_id", orderId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as CustomerReview[];
}

export async function fetchCustomerReviews(customerId: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select(reviewColumns)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CustomerReview[];
}

export async function createCustomerReview(input: {
  orderId: string;
  rating: number;
  comment: string | null;
  menuItemId: string | null;
  riderId: string | null;
}) {
  const { data, error } = await supabase.rpc("create_customer_review", {
    p_order_id: input.orderId,
    p_rating: input.rating,
    p_comment: input.comment,
    p_menu_item_id: input.menuItemId,
    p_rider_id: input.riderId,
  });

  if (error) throw error;
  return data as {
    success?: boolean;
    review_id?: string;
    order_id?: string;
    rating?: number;
    comment?: string | null;
    menu_item_id?: string | null;
    rider_id?: string | null;
  };
}
