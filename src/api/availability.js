import { supabase } from '../../backend/config/supabaseClient.js';

export async function getAvailability(userId) {
  const { data, error } = await supabase
    .from('availability')
    .select('*')
    .eq('profile_id', userId)
    .order('date');

  if (error) {
    console.error('getAvailability error:', error);
    return [];
  }

  return data;
}

export async function addAvailability(userId, date) {
  const { data, error } = await supabase
    .from('availability')
    .insert({ profile_id: userId, date })
    .select()
    .single();

  if (error) console.error('addAvailability error:', error);
  return data;
}

export async function removeAvailability(userId, date) {
  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('profile_id', userId)
    .eq('date', date);

  if (error) console.error('removeAvailability error:', error);
}

export async function clearAvailability(userId) {
  const { error } = await supabase
    .from('availability')
    .delete()
    .eq('profile_id', userId);

  if (error) console.error('clearAvailability error:', error);
}