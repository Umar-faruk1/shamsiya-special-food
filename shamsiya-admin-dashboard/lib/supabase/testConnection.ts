import { supabase } from './client';

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .limit(10);

  if (error) {
    console.error('❌ Supabase connection failed:', error);
    return {
      success: false,
      error,
    };
  }

  console.log('✅ Supabase connection successful');
  console.log('Categories:', data);

  return {
    success: true,
    data,
  };
}