import { Address } from "../types";
import { supabase } from "./supabase";

const addressColumns =
  "id,user_id,label,address,city,latitude,longitude,delivery_instructions,is_default,created_at,updated_at";

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Please sign in to manage addresses.");
  return data.user.id;
}

async function clearDefaultAddress(userId: string, exceptId?: string) {
  let query = supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);
  if (exceptId) query = query.neq("id", exceptId);
  const { error } = await query;
  if (error) throw error;
}

export async function getAddresses(): Promise<Address[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("addresses")
    .select(addressColumns)
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Address[];
}

export type AddressInput = Omit<
  Address,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export async function createAddress(input: AddressInput): Promise<Address> {
  const userId = await requireUserId();
  if (input.is_default) await clearDefaultAddress(userId);
  const { data, error } = await supabase
    .from("addresses")
    .insert({ user_id: userId, ...input })
    .select(addressColumns)
    .single();
  if (error) throw error;
  return data as Address;
}

export async function updateAddress(id: string, input: AddressInput) {
  const userId = await requireUserId();
  if (input.is_default) await clearDefaultAddress(userId, id);
  const { data, error } = await supabase
    .from("addresses")
    .update(input)
    .eq("id", id)
    .eq("user_id", userId)
    .select(addressColumns)
    .single();
  if (error) throw error;
  return data as Address;
}

export async function deleteAddress(id: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function setDefaultAddress(id: string) {
  const userId = await requireUserId();
  await clearDefaultAddress(userId);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
