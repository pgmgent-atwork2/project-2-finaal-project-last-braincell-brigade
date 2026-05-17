import { supabase } from "../../backend/config/supabaseClient.js";

export async function getUsers() {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
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
    .select('id, first_name, last_name')
    .order('last_name');

  if (error) {
    console.error('getAllProfiles error:', error);
    throw error;
  }

  return data;
}