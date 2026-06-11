import { supabase } from "../../backend/config/supabaseClient.js";

export async function registerForMatch(matchId, reserve = false) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
    .from('match_registrations')
    .insert({ match_id: matchId, profile_id: user.id, reserve })
    .select()
    .single();
    
    if (error) {
        console.error('registerForMatch error:', error);
        throw error;
    }

    return data;
}

export async function getMyRegistrations() {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('match_registrations')
    .select('match_id')
    .eq('profile_id', user.id);

  if (error) {
    console.error('getMyRegistrations error:', error);
    return [];
  }

  return data.map(r => r.match_id);
}

export async function unregisterFromMatch(matchId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('match_registrations')
    .delete()
    .eq('match_id', matchId)
    .eq('profile_id', user.id);

  if (error) {
    console.error('unregisterFromMatch error:', error);
    throw error;
  }
}

export async function getMatchRegistrations(matchId) {
  const { data, error } = await supabase
    .from('match_registrations')
    .select('id, reserve, profile_id, profiles(first_name, last_name)')
    .eq('match_id', matchId);

  if (error) {
    console.error('getMatchRegistrations error:', error);
    throw error;
  }

  return data;
}

export async function adminRegisterPlayer(matchId, profileId, reserve = false) {
  const { data, error } = await supabase
    .from('match_registrations')
    .insert({ match_id: matchId, profile_id: profileId, reserve })
    .select()
    .single();

  if (error) {
    console.error('adminRegisterPlayer error:', error);
    throw error;
  }

  return data;
}

export async function adminUnregisterPlayer(registrationId) {
  const { error } = await supabase
    .from('match_registrations')
    .delete()
    .eq('id', registrationId);

  if (error) {
    console.error('adminUnregisterPlayer error:', error);
    throw error;
  }
}

export async function updateReserveStatus(registrationId, reserve) {
  const { data, error } = await supabase
    .from('match_registrations')
    .update({ reserve })
    .eq('id', registrationId)
    .select()
    .single();

  if (error) {
    console.error('updateReserveStatus error:', error);
    throw error;
  }

  return data;
}
