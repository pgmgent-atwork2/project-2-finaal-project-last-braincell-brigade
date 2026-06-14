import { supabase } from '../config/supabaseClient.js';

export async function signUp(email, password, firstName = '', lastName = '') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) throw error;

  // Upsert user profile — handles case where trigger already created it
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }
  }

  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function ensureProfileExists(userId) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.id !== userId) return;

  const metadata = user.user_metadata || {};

  // Upsert instead of check-then-insert — avoids race conditions and duplicate errors
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        email: user.email,
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
      },
      { onConflict: 'id' }
    );

  if (upsertError) {
    console.error('Error upserting profile:', upsertError);
  }
}