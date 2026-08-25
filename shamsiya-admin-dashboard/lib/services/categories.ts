import { supabase } from '@/lib/supabase/client';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function createCategory(category: {
  name: string;
  description?: string;
}) {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: category.name,
      description: category.description ?? '',
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to create categories. Confirm your profile role is admin and apply the categories RLS migration in Supabase.');
    }
    throw error;
  }

  return data;
}


export async function updateCategory(
  id: string,
  category: {
    name?: string;
    description?: string;
    is_active?: boolean;
  }
) {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '42501') {
      throw new Error('You do not have permission to update categories. Confirm your profile role is admin and apply the categories RLS migration in Supabase.');
    }
    throw error;
  }

  if (!data) {
    throw new Error('Category was not updated. Confirm your profile role is admin and that the category is visible to your account.');
  }

  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }

  return true;
}