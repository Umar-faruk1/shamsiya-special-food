import { Promotion, PromotionValidation } from "../types";
import { supabase } from "./supabase";

const promotionColumns =
  "id,title,description,image_url,discount_type,discount_value,minimum_order,max_discount,promo_code,start_date,end_date,is_active,created_at,updated_at";

export async function getActivePromotions(): Promise<Promotion[]> {
  const { data, error } = await supabase
    .from("promotions")
    .select(promotionColumns)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Promotion[];
}

export async function validatePromotion(
  promoCode: string,
  subtotal: number,
): Promise<PromotionValidation> {
  const code = promoCode.trim();
  if (!code) throw new Error("Enter a promo code.");
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    throw new Error("The order subtotal is invalid.");
  }

  const { data, error } = await supabase.rpc("validate_customer_promotion", {
    p_promo_code: code,
    p_subtotal: subtotal,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid or expired promo code.");
  }

  const value = data as Record<string, unknown>;
  const discountType = value.discount_type;
  const result: PromotionValidation = {
    promotion_id: String(value.promotion_id ?? ""),
    title: String(value.title ?? "Promotion"),
    promo_code: typeof value.promo_code === "string" ? value.promo_code : null,
    discount_type: discountType === "percentage" ? "percentage" : "fixed",
    discount_value: Number(value.discount_value ?? 0),
    minimum_order: Number(value.minimum_order ?? 0),
    max_discount:
      value.max_discount == null ? null : Number(value.max_discount),
    discount_amount: Number(value.discount_amount ?? 0),
  };
  if (!result.promotion_id || !Number.isFinite(result.discount_amount)) {
    throw new Error("Invalid or expired promo code.");
  }
  return result;
}
