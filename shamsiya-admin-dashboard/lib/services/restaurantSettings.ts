import { supabase } from "@/lib/supabase/client";

export type RestaurantSettings = {
  id: string;
  restaurant_name: string;
  description: string | null;
  logo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  currency: string;
  delivery_fee: number;
  minimum_order: number;
  opening_time: string | null;
  closing_time: string | null;
  is_accepting_orders: boolean;
  created_at: string;
  updated_at: string;
};

export type RestaurantSettingsInput = Omit<
  RestaurantSettings,
  "id" | "created_at" | "updated_at"
>;

const settingsSelect =
  "id, restaurant_name, description, logo_url, phone, email, address, currency, delivery_fee, minimum_order, opening_time, closing_time, is_accepting_orders, created_at, updated_at";

function settingsError(error: { code?: string; message?: string }) {
  if (error.code === "42501") {
    return new Error(
      "You do not have permission to manage restaurant settings. Confirm that your profile is an active admin.",
    );
  }
  return new Error(error.message || "Unable to manage restaurant settings.");
}

export async function getRestaurantSettings(): Promise<RestaurantSettings> {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .select(settingsSelect)
    .limit(1)
    .maybeSingle();

  if (error) throw settingsError(error);
  if (!data) {
    throw new Error("Restaurant settings have not been configured yet.");
  }

  return data as RestaurantSettings;
}

export async function updateRestaurantSettings(
  id: string,
  input: RestaurantSettingsInput,
): Promise<RestaurantSettings> {
  const { data, error } = await supabase
    .from("restaurant_settings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(settingsSelect)
    .single();

  if (error) throw settingsError(error);
  return data as RestaurantSettings;
}
