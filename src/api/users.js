import { supabase } from "../../backend/config/supabaseClient.js";

export async function getUsers() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("first_name");

    if (error) {
        console.error("getUsers error:", error);
        return [];
    }

    return data;
}

export async function getAllProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('last_name');

  if (error) {
    console.error('getAllProfiles error:', error);
    throw error;
  }

  return data;
}

export async function updateProfile(id, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('updateProfile error:', error);
    return null;
  }

  return data;
}

export async function deleteProfile(id) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('deleteProfile error:', error);
    return false;
  }

  return true;
}
