import { supabase } from "@/lib/supabase/client";

export type PromotionDiscountType = "percentage" | "fixed";

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  discount_type: PromotionDiscountType;
  discount_value: number;
  minimum_order: number;
  max_discount: number | null;
  promo_code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PromotionInput = {
  title: string;
  description: string | null;
  image_url: string | null;
  discount_type: PromotionDiscountType;
  discount_value: number;
  minimum_order: number;
  max_discount: number | null;
  promo_code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

export async function getPromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from("promotions")
    .select(
      "id, title, description, image_url, discount_type, discount_value, minimum_order, max_discount, promo_code, start_date, end_date, is_active, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Promotion[];
}

export async function createPromotion(input: PromotionInput) {
  const { data, error } = await supabase
    .from("promotions")
    .insert(input)
    .select()
    .single();

  if (error) throw formatPromotionError(error);
  return data as Promotion;
}

export async function updatePromotion(id: string, input: PromotionInput) {
  const { data, error } = await supabase
    .from("promotions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw formatPromotionError(error);
  return data as Promotion;
}

export async function togglePromotion(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from("promotions")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) throw formatPromotionError(error);
  return data as Promotion;
}

export async function deletePromotion(id: string) {
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) throw formatPromotionError(error);
}

function formatPromotionError(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return new Error(
      "That promo code is already in use. Choose a different code.",
    );
  }
  if (error.code === "42501") {
    return new Error(
      "You do not have permission to manage promotions. Confirm your profile is an active admin.",
    );
  }
  return new Error(error.message || "Unable to save the promotion.");
}
