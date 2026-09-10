import { Asset } from "expo-asset";
import { Category, FoodItem } from "../types";
import { supabase } from "./supabase";

export interface MenuCategoryRow {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface MenuItemRow {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number | string;
  image_url: string | null;
  ingredients: string[] | null;
  available: boolean;
  featured: boolean;
  rating: number | string;
  review_count: number;
  preparation_time: number | null;
  calories: number | null;
  created_at: string;
  updated_at: string;
}

export interface MenuItemOptionRow {
  id: string;
  menu_item_id: string;
  name: string;
  option_type: string | null;
  price: number | string;
  is_available: boolean;
  created_at: string;
}

const foodPlaceholder = Asset.fromModule(
  require("../../assets/images/icon.png"),
).uri;

export function mapCategory(row: MenuCategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    iconName: row.icon || "Utensils",
    image: row.image_url?.trim() || foodPlaceholder,
    itemCount: 0,
    description: row.description || "",
  };
}

export function mapMenuItem(row: MenuItemRow): FoodItem {
  const price = Number(row.price);
  const rating = Number(row.rating);

  return {
    id: row.id,
    name: row.name,
    category: row.category_id || "uncategorized",
    price: Number.isFinite(price) ? price : 0,
    rating: Number.isFinite(rating) ? rating : 0,
    reviewsCount: row.review_count,
    prepTime: row.preparation_time != null ? `${row.preparation_time} min` : "",
    calories: row.calories ?? 0,
    spicyLevel: 0,
    isHalal: false,
    isVegetarian: false,
    isChefSpecial: row.featured,
    isPopular: row.featured,
    tags: [],
    image: row.image_url?.trim() || foodPlaceholder,
    description: row.description?.trim() || "",
    ingredients: row.ingredients || [],
    allergens: [],
    nutrition: {
      calories: row.calories ?? 0,
      protein: "",
      carbs: "",
      fat: "",
    },
  };
}

export async function fetchMenuItemDetail(menuItemId: string) {
  if (!menuItemId) {
    throw new Error("A menu item ID is required.");
  }

  const [menuItemResult, optionsResult] = await Promise.all([
    supabase
      .from("menu_items")
      .select(
        "id,category_id,name,description,price,image_url,ingredients,available,featured,rating,review_count,preparation_time,calories,created_at,updated_at",
      )
      .eq("id", menuItemId)
      .eq("available", true)
      .maybeSingle(),
    supabase
      .from("menu_item_options")
      .select("id,menu_item_id,name,option_type,price,is_available,created_at")
      .eq("menu_item_id", menuItemId)
      .eq("is_available", true),
  ]);

  if (menuItemResult.error) throw menuItemResult.error;
  if (optionsResult.error) throw optionsResult.error;

  if (!menuItemResult.data) {
    throw new Error("This food item is unavailable right now.");
  }

  return {
    menuItem: {
      ...mapMenuItem(menuItemResult.data as MenuItemRow),
      calories: (menuItemResult.data as MenuItemRow).calories,
    },
    options: (optionsResult.data as MenuItemOptionRow[]) ?? [],
  };
}

export async function fetchMenuData() {
  const [categoriesResult, menuItemsResult] = await Promise.all([
    supabase
      .from("categories")
      .select(
        "id,name,description,image_url,icon,is_active,sort_order,created_at,updated_at",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_items")
      .select(
        "id,category_id,name,description,price,image_url,ingredients,available,featured,rating,review_count,preparation_time,calories,created_at,updated_at",
      )
      .eq("available", true)
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  if (categoriesResult.error) throw categoriesResult.error;
  if (menuItemsResult.error) throw menuItemsResult.error;

  return {
    categories: (categoriesResult.data as MenuCategoryRow[]).map(mapCategory),
    foodItems: (menuItemsResult.data as MenuItemRow[]).map(mapMenuItem),
  };
}
