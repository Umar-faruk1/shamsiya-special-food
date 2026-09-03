import { supabase } from "@/lib/supabase/client";

export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export type Review = {
  id: string;
  order_id: string;
  customer_id: string;
  rider_id: string | null;
  menu_item_id: string | null;
  rating: ReviewRating;
  comment: string | null;
  created_at: string;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  rider: {
    id: string;
    vehicle_type: string | null;
    vehicle_number: string | null;
    profile: {
      id: string;
      full_name: string | null;
      email: string | null;
      phone: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  menu_item: {
    id: string;
    name: string | null;
    price: number | null;
    image_url: string | null;
  } | null;
  order: {
    id: string;
    order_number: string | null;
    status: string | null;
    total: number | null;
    created_at: string | null;
  } | null;
};

export type ReviewStats = {
  totalReviews: number;
  averageRating: number;
  starCounts: Record<ReviewRating, number>;
};

export async function getReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      customer:profiles!reviews_customer_id_fkey (
        id,
        full_name,
        email,
        phone,
        avatar_url
      ),
      rider:riders!reviews_rider_id_fkey (
        id,
        vehicle_type,
        vehicle_number,
        profile:profiles!riders_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      ),
      menu_item:menu_items!reviews_menu_item_id_fkey (
        id,
        name,
        price,
        image_url
      ),
      order:orders!reviews_order_id_fkey (
        id,
        order_number,
        status,
        total,
        created_at
      )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as Review[];
}

export async function getReview(id: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
      *,
      customer:profiles!reviews_customer_id_fkey (
        id,
        full_name,
        email,
        phone,
        avatar_url
      ),
      rider:riders!reviews_rider_id_fkey (
        id,
        vehicle_type,
        vehicle_number,
        profile:profiles!riders_id_fkey (
          id,
          full_name,
          email,
          phone,
          avatar_url
        )
      ),
      menu_item:menu_items!reviews_menu_item_id_fkey (
        id,
        name,
        price,
        image_url
      ),
      order:orders!reviews_order_id_fkey (
        id,
        order_number,
        status,
        total,
        created_at
      )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Review | null) ?? null;
}

export function getReviewStats(reviews: Review[]): ReviewStats {
  const totalReviews = reviews.length;
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    ReviewRating,
    number
  >;

  reviews.forEach((review) => {
    const rating = review.rating;
    if (rating >= 1 && rating <= 5) {
      starCounts[rating as ReviewRating] += 1;
    }
  });

  const totalPoints = reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    totalReviews,
    averageRating: totalReviews
      ? Number((totalPoints / totalReviews).toFixed(1))
      : 0,
    starCounts,
  };
}
