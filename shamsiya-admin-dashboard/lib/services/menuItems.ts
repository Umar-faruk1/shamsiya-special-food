import { supabase } from '@/lib/supabase/client';

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  ingredients: string[] | null;
  available: boolean;
  featured: boolean;
  rating: number | null;
  review_count: number;
  preparation_time: number | null;
  calories: number | null;
  created_at: string;
  updated_at: string;
};

export async function getMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function createMenuItem(item: {
  name: string;
  category_id: string;
  description?: string;
  price: number;
  ingredients: string[] | null;
  preparation_time?: number;
  calories?: number | null;
  image_url?: string | null;
  available?: boolean;
  featured?: boolean;
}) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({
      name: item.name,
      category_id: item.category_id,
      description: item.description ?? '',
      price: item.price,
      ingredients: item.ingredients ?? [],
      preparation_time: item.preparation_time ?? 15,
      calories: item.calories ?? null,
      image_url: item.image_url ?? null,
      available: item.available ?? true,
      featured: item.featured ?? false,
    })
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .single();

  if (error) {
    if (error.code === '42501') {
      throw new Error(
        'You do not have permission to create menu items. Confirm that your profile is an active admin.'
      );
    }

    throw error;
  }

  return data;
}

export async function updateMenuItem(
  id: string,
  item: {
    name?: string;
    category_id?: string;
    description?: string;
    price?: number;
    ingredients: string[] | null;
    preparation_time?: number;
    calories?: number | null;
    image_url?: string | null;
    available?: boolean;
    featured?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(item)
    .eq('id', id)
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .maybeSingle();

  if (error) {
    if (error.code === '42501') {
      throw new Error(
        'You do not have permission to update menu items. Confirm that your profile is an active admin.'
      );
    }

    throw error;
  }

  if (!data) {
    throw new Error(
      'Menu item was not updated. Confirm that the item exists and your admin account can access it.'
    );
  }

  return data;
}

export async function deleteMenuItem(id: string) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) {
    if (error.code === '42501') {
      throw new Error(
        'You do not have permission to delete menu items.'
      );
    }

    throw error;
  }

  return true;
}