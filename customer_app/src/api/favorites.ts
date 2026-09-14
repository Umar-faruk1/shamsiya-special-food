import { supabase } from "./supabase";

export interface FavoriteRow {
  id: string;
  user_id: string;
  menu_item_id: string;
  created_at: string;
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user?.id ?? null;
}

export async function getFavorites(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("menu_item_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((favorite) => favorite.menu_item_id as string);
}

export async function isFavorite(menuItemId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("menu_item_id", menuItemId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

export async function addFavorite(menuItemId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Please sign in to save favorites.");

  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: userId, menu_item_id: menuItemId })
    .select("id,user_id,menu_item_id,created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const alreadyFavorite = await isFavorite(menuItemId);
      if (alreadyFavorite) return;
    }
    throw error;
  }

  void (data as FavoriteRow);
}

export async function removeFavorite(menuItemId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Please sign in to manage favorites.");

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", userId)
    .eq("menu_item_id", menuItemId);

  if (error) throw error;
}

export async function toggleFavorite(
  menuItemId: string,
  currentlyFavorited?: boolean,
): Promise<boolean> {
  const favorited =
    currentlyFavorited === undefined
      ? await isFavorite(menuItemId)
      : currentlyFavorited;

  if (favorited) {
    await removeFavorite(menuItemId);
    return false;
  }

  await addFavorite(menuItemId);
  return true;
}
