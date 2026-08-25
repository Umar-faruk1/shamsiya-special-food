import { supabase } from './client';

export async function signInAdmin(
  email: string,
  password: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error('Unable to authenticate user.');
  }

  // Get the user's profile
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('id', data.user.id)
      .single();

  if (profileError) {
    await supabase.auth.signOut();
    throw new Error('Admin profile could not be found.');
  }

  // Check role
  if (profile.role !== 'admin') {
    await supabase.auth.signOut();

    throw new Error(
      'Access denied. You do not have administrator privileges.'
    );
  }

  // Check account status
  if (profile.status !== 'active') {
    await supabase.auth.signOut();

    throw new Error(
      'Your administrator account is not active.'
    );
  }

  return {
    user: data.user,
    profile,
  };
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentAdmin() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } =
    await supabase
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('id', user.id)
      .single();

  if (error || !profile) {
    return null;
  }

  if (
    profile.role !== 'admin' ||
    profile.status !== 'active'
  ) {
    return null;
  }

  return {
    user,
    profile,
  };
}