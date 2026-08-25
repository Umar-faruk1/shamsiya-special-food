import { supabase } from './client';

export async function requireAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      authenticated: false,
      admin: false,
      user: null,
      profile: null,
    };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, status')
    .eq('id', user.id)
    .single();

  if (
    error ||
    !profile ||
    profile.role !== 'admin' ||
    profile.status !== 'active'
  ) {
    return {
      authenticated: true,
      admin: false,
      user,
      profile: null,
    };
  }

  return {
    authenticated: true,
    admin: true,
    user,
    profile,
  };
}